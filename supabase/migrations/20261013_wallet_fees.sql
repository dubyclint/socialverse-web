-- Wallet fees (admin-editable in platform_configurations.fee_settings),
-- withdrawable (earned) balance, and the withdrawal request lifecycle.
-- Enum values GIFT_FEE / WITHDRAWAL_REFUND / DEPOSIT_FEE are added separately
-- (ALTER TYPE ... ADD VALUE cannot run inside this transaction).

insert into public.platform_configurations (config_key, config_values)
values ('fee_settings', '{"deposit_fee_pct": 1.2, "gift_fee_pct": 5, "withdrawal_fee_pct": 37, "withdrawal_tax_pct": 0, "pew_usd_rate": 1, "min_withdrawal_pew": 10}'::jsonb)
on conflict (config_key) do nothing;

create or replace function public.fee_setting(p_key text, p_default numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select (config_values ->> p_key)::numeric from platform_configurations where config_key = 'fee_settings'), p_default)
$$;

alter table public.wallets
  add column if not exists withdrawable_balance numeric not null default 0 check (withdrawable_balance >= 0);

alter table public.withdrawals
  add column if not exists method text check (method in ('bank', 'crypto')),
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists fee_pewgift numeric not null default 0,
  add column if not exists tax_pewgift numeric not null default 0,
  add column if not exists payout_usd numeric,
  add column if not exists admin_note text,
  add column if not exists reviewed_by uuid references public."user"(user_id);

update public.withdrawals set status = 'pending' where status is null;
alter table public.withdrawals drop constraint if exists withdrawals_status_check;
alter table public.withdrawals add constraint withdrawals_status_check
  check (status in ('pending', 'processing', 'successful', 'failed'));

-- Deposits: app processing fee (deposit_fee_pct) is deducted from the credited
-- PEW. Only P2P purchases count towards the withdrawable balance.
create or replace function public.settle_deposit(p_deposit_id uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_gross numeric;
  v_status public.deposit_state;
  v_route public.deposit_route;
  v_fee numeric;
  v_net numeric;
begin
  select user_id, credited_pewgift, status, route into v_user, v_gross, v_status, v_route
  from deposits where id = p_deposit_id for update;

  if v_user is null then
    raise exception 'deposit not found' using errcode = 'P0002';
  end if;
  if v_status = 'SETTLED' then
    return v_gross;
  end if;
  if v_gross <= 0 then
    raise exception 'nothing to credit' using errcode = '22023';
  end if;

  v_fee := round(v_gross * fee_setting('deposit_fee_pct', 1.2) / 100, 4);
  v_net := v_gross - v_fee;

  perform ensure_wallet(v_user);
  perform 1 from wallets where user_id = v_user and currency = 'PEW' for update;

  update wallets
     set balance = balance + v_net,
         withdrawable_balance = withdrawable_balance + case when v_route = 'P2P' then v_net else 0 end,
         updated_at = now()
   where user_id = v_user and currency = 'PEW';

  insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
  values (v_user, v_gross, 'DEPOSIT', p_deposit_id, jsonb_build_object('deposit_id', p_deposit_id, 'route', v_route));
  if v_fee > 0 then
    insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
    values (v_user, -v_fee, 'DEPOSIT_FEE', p_deposit_id, jsonb_build_object('deposit_id', p_deposit_id, 'fee_pct', fee_setting('deposit_fee_pct', 1.2)));
  end if;

  update deposits
     set status = 'SETTLED', settled_at = now(), credited_pewgift = v_net,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('app_fee_pewgift', v_fee)
   where id = p_deposit_id;

  return v_net;
end $$;

-- Gifts: sender pays the full value, the platform keeps gift_fee_pct, and the
-- recipient's net is earned (withdrawable). Escrow releases are earned too.
create or replace function public.transfer_pewgift(
  p_sender_id uuid, p_recipient_id uuid, p_amount numeric,
  p_debit_type wallet_transaction_ledger_type, p_credit_type wallet_transaction_ledger_type,
  p_reference_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns numeric language plpgsql security definer set search_path = public as $$
declare
  v_first uuid;
  v_second uuid;
  v_sender_balance numeric;
  v_locked boolean;
  v_is_gift boolean := p_credit_type in ('GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED');
  v_earned boolean := p_credit_type in ('GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED', 'ESCROW_MILESTONE_RELEASE', 'AD_ENGAGEMENT_REVENUE');
  v_fee numeric := 0;
  v_net numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'transfer amount must be positive' using errcode = '22023';
  end if;
  if p_sender_id = p_recipient_id then
    raise exception 'cannot transfer to self' using errcode = '22023';
  end if;

  perform ensure_wallet(p_sender_id);
  perform ensure_wallet(p_recipient_id);

  v_first := least(p_sender_id, p_recipient_id);
  v_second := greatest(p_sender_id, p_recipient_id);
  perform 1 from wallets where user_id = v_first and currency = 'PEW' for update;
  perform 1 from wallets where user_id = v_second and currency = 'PEW' for update;

  select balance, is_locked into v_sender_balance, v_locked
  from wallets where user_id = p_sender_id and currency = 'PEW';

  if v_locked then
    raise exception 'sender balance is locked' using errcode = '55006';
  end if;
  if v_sender_balance < p_amount then
    raise exception 'insufficient balance' using errcode = '23514';
  end if;

  if v_is_gift then
    v_fee := round(p_amount * fee_setting('gift_fee_pct', 5) / 100, 4);
  end if;
  v_net := p_amount - v_fee;

  -- Spending draws on non-withdrawable funds first.
  update wallets
     set balance = balance - p_amount,
         withdrawable_balance = least(withdrawable_balance, balance - p_amount),
         updated_at = now()
   where user_id = p_sender_id and currency = 'PEW';

  update wallets
     set balance = balance + v_net,
         withdrawable_balance = withdrawable_balance + case when v_earned then v_net else 0 end,
         updated_at = now()
   where user_id = p_recipient_id and currency = 'PEW';

  insert into wallet_ledger (wallet_id, amount, transaction_type, counterpart_id, reference_id, metadata)
  values
    (p_sender_id, -p_amount, p_debit_type, p_recipient_id, p_reference_id, p_metadata),
    (p_recipient_id, p_amount, p_credit_type, p_sender_id, p_reference_id, p_metadata);
  if v_fee > 0 then
    insert into wallet_ledger (wallet_id, amount, transaction_type, counterpart_id, reference_id, metadata)
    values (p_recipient_id, -v_fee, 'GIFT_FEE', p_sender_id, p_reference_id,
            p_metadata || jsonb_build_object('fee_pct', fee_setting('gift_fee_pct', 5)));
  end if;

  select balance into v_sender_balance from wallets where user_id = p_sender_id and currency = 'PEW';
  return v_sender_balance;
end $$;

-- Post gifts go through the same ledgered transfer.
drop function if exists public.process_pewgift(uuid, uuid, numeric, uuid);
create or replace function public.process_pewgift(p_post_id uuid, p_sender_id uuid, p_receiver_id uuid, p_amount numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.uid() <> p_sender_id then
    raise exception 'sender must be the caller' using errcode = '42501';
  end if;
  perform transfer_pewgift(p_sender_id, p_receiver_id, p_amount, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM',
                           p_post_id, jsonb_build_object('context', 'post', 'post_id', p_post_id));
  insert into gift_transactions (sender_id, recipient_id, credit_value)
  values (p_sender_id, p_receiver_id, p_amount);
end $$;

create or replace function public.process_live_pewgift(target_streamer_id uuid, gift_amount numeric)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_sender uuid := auth.uid();
begin
  if v_sender is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  perform transfer_pewgift(v_sender, target_streamer_id, gift_amount, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM',
                           null, jsonb_build_object('context', 'stream'));
  insert into gift_transactions (sender_id, recipient_id, credit_value)
  values (v_sender, target_streamer_id, gift_amount);
  return true;
end $$;

-- Withdrawals: only earned PEW; fee + tax shown up front; held until an admin decides.
create or replace function public.request_withdrawal(p_amount numeric, p_method text, p_details jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_wallet wallets%rowtype;
  v_fee numeric;
  v_tax numeric;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_method not in ('bank', 'crypto') then
    raise exception 'Choose bank or crypto' using errcode = '22023';
  end if;
  if p_amount is null or p_amount < fee_setting('min_withdrawal_pew', 10) then
    raise exception 'Minimum withdrawal is % PEW', fee_setting('min_withdrawal_pew', 10) using errcode = '22023';
  end if;

  perform ensure_wallet(v_user);
  select * into v_wallet from wallets where user_id = v_user and currency = 'PEW' for update;
  if v_wallet.is_locked then
    raise exception 'Your wallet is locked' using errcode = '55006';
  end if;
  if v_wallet.withdrawable_balance < p_amount or v_wallet.balance < p_amount then
    raise exception 'Amount exceeds your withdrawable balance' using errcode = '23514';
  end if;

  v_fee := round(p_amount * fee_setting('withdrawal_fee_pct', 37) / 100, 4);
  v_tax := round(p_amount * fee_setting('withdrawal_tax_pct', 0) / 100, 4);

  update wallets
     set balance = balance - p_amount, withdrawable_balance = withdrawable_balance - p_amount, updated_at = now()
   where user_id = v_user and currency = 'PEW';

  insert into withdrawals (user_id, amount, currency, status, method, details, destination, fee_pewgift, tax_pewgift, payout_usd)
  values (v_user, p_amount, 'PEW', 'pending', p_method, coalesce(p_details, '{}'::jsonb), p_method,
          v_fee, v_tax, round((p_amount - v_fee - v_tax) * fee_setting('pew_usd_rate', 1), 2))
  returning id into v_id;

  insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
  values (v_user, -p_amount, 'WITHDRAWAL', v_id, jsonb_build_object('withdrawal_id', v_id, 'fee', v_fee, 'tax', v_tax, 'method', p_method));
  return v_id;
end $$;

create or replace function public.resolve_withdrawal(p_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := auth.uid();
  v_row withdrawals%rowtype;
begin
  if v_admin is not null and not exists (select 1 from "user" where user_id = v_admin and role in ('admin', 'manager')) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_status not in ('processing', 'successful', 'failed') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  select * into v_row from withdrawals where id = p_id for update;
  if v_row.id is null then
    raise exception 'Withdrawal not found' using errcode = 'P0002';
  end if;
  if v_row.status in ('successful', 'failed') then
    raise exception 'Withdrawal already closed' using errcode = '22023';
  end if;

  if p_status = 'failed' then
    perform 1 from wallets where user_id = v_row.user_id and currency = 'PEW' for update;
    update wallets
       set balance = balance + v_row.amount, withdrawable_balance = withdrawable_balance + v_row.amount, updated_at = now()
     where user_id = v_row.user_id and currency = 'PEW';
    insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
    values (v_row.user_id, v_row.amount, 'WITHDRAWAL_REFUND', p_id, jsonb_build_object('withdrawal_id', p_id, 'note', p_note));
  end if;

  update withdrawals
     set status = p_status, admin_note = coalesce(p_note, admin_note), reviewed_by = v_admin,
         processed_at = case when p_status in ('successful', 'failed') then now() else processed_at end,
         updated_at = now()
   where id = p_id;
end $$;

revoke execute on function public.request_withdrawal(numeric, text, jsonb) from public, anon;
grant execute on function public.request_withdrawal(numeric, text, jsonb) to authenticated;
revoke execute on function public.resolve_withdrawal(uuid, text, text) from public, anon;
grant execute on function public.resolve_withdrawal(uuid, text, text) to authenticated;
revoke execute on function public.transfer_pewgift(uuid, uuid, numeric, wallet_transaction_ledger_type, wallet_transaction_ledger_type, uuid, jsonb) from public, anon, authenticated;
