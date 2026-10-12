-- Pages hold their own PEW, separate from the people who manage them.
create table if not exists public.page_wallets (
  page_id uuid primary key references public.pages(id) on delete restrict,
  balance numeric not null default 0 check (balance >= 0),
  withdrawable_balance numeric not null default 0 check (withdrawable_balance >= 0),
  is_locked boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.page_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.page_wallets(page_id) on delete restrict,
  amount numeric not null check (amount <> 0),
  transaction_type public.wallet_transaction_ledger_type not null,
  counterpart_id uuid,
  counterpart_type text check (counterpart_type in ('USER', 'PAGE')),
  operator_id uuid references public."user"(user_id),
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists page_wallet_ledger_page_idx on public.page_wallet_ledger (page_id, created_at desc);

alter table public.page_wallets enable row level security;
alter table public.page_wallet_ledger enable row level security;
revoke all on public.page_wallets, public.page_wallet_ledger from anon, authenticated;

/**
 * Moves PEW between a person and a Page (or two Pages). Gifts pay the gift
 * fee on the receiving side and count as withdrawable earnings; PAGE_PAYOUT
 * moves a Page's withdrawable earnings to a person as withdrawable PEW.
 * Callers (server API only) must have checked the operator's Page role.
 */
create or replace function public.page_wallet_transfer(
  p_from_type text, p_from_id uuid,
  p_to_type text, p_to_id uuid,
  p_amount numeric,
  p_debit_type public.wallet_transaction_ledger_type,
  p_credit_type public.wallet_transaction_ledger_type,
  p_operator uuid,
  p_reference_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_gift boolean := p_credit_type in ('GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED');
  v_earned boolean := p_credit_type in ('GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED', 'PAGE_PAYOUT');
  v_payout boolean := p_debit_type = 'PAGE_PAYOUT';
  v_balance numeric;
  v_withdrawable numeric;
  v_locked boolean;
  v_fee numeric := 0;
  v_net numeric;
  v_ids uuid[];
  v_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'transfer amount must be positive' using errcode = '22023';
  end if;
  if p_from_type not in ('USER', 'PAGE') or p_to_type not in ('USER', 'PAGE') or p_from_id = p_to_id then
    raise exception 'invalid transfer parties' using errcode = '22023';
  end if;

  if p_from_type = 'USER' then perform ensure_wallet(p_from_id); else insert into page_wallets (page_id) values (p_from_id) on conflict do nothing; end if;
  if p_to_type = 'USER' then perform ensure_wallet(p_to_id); else insert into page_wallets (page_id) values (p_to_id) on conflict do nothing; end if;

  v_ids := array(select unnest(array[p_from_id, p_to_id]) order by 1);
  foreach v_id in array v_ids loop
    perform 1 from wallets where user_id = v_id and currency = 'PEW' for update;
    perform 1 from page_wallets where page_id = v_id for update;
  end loop;

  if p_from_type = 'USER' then
    select balance, withdrawable_balance, is_locked into v_balance, v_withdrawable, v_locked from wallets where user_id = p_from_id and currency = 'PEW';
  else
    select balance, withdrawable_balance, is_locked into v_balance, v_withdrawable, v_locked from page_wallets where page_id = p_from_id;
  end if;
  if v_locked then raise exception 'sender balance is locked' using errcode = '55006'; end if;
  if v_balance < p_amount then raise exception 'insufficient balance' using errcode = '23514'; end if;
  if v_payout and v_withdrawable < p_amount then raise exception 'insufficient withdrawable balance' using errcode = '23514'; end if;

  if v_is_gift then v_fee := round(p_amount * fee_setting('gift_fee_pct', 5) / 100, 4); end if;
  v_net := p_amount - v_fee;

  if p_from_type = 'USER' then
    update wallets set balance = balance - p_amount,
      withdrawable_balance = case when v_payout then withdrawable_balance - p_amount else least(withdrawable_balance, balance - p_amount) end,
      updated_at = now()
    where user_id = p_from_id and currency = 'PEW';
    insert into wallet_ledger (wallet_id, amount, transaction_type, counterpart_id, reference_id, metadata)
    values (p_from_id, -p_amount, p_debit_type, p_to_id, p_reference_id, p_metadata || jsonb_build_object('counterpart_type', p_to_type));
  else
    update page_wallets set balance = balance - p_amount,
      withdrawable_balance = case when v_payout then withdrawable_balance - p_amount else least(withdrawable_balance, balance - p_amount) end,
      updated_at = now()
    where page_id = p_from_id;
    insert into page_wallet_ledger (page_id, amount, transaction_type, counterpart_id, counterpart_type, operator_id, reference_id, metadata)
    values (p_from_id, -p_amount, p_debit_type, p_to_id, p_to_type, p_operator, p_reference_id, p_metadata);
  end if;

  if p_to_type = 'USER' then
    update wallets set balance = balance + v_net,
      withdrawable_balance = withdrawable_balance + case when v_earned then v_net else 0 end,
      updated_at = now()
    where user_id = p_to_id and currency = 'PEW';
    insert into wallet_ledger (wallet_id, amount, transaction_type, counterpart_id, reference_id, metadata)
    values (p_to_id, p_amount, p_credit_type, p_from_id, p_reference_id, p_metadata || jsonb_build_object('counterpart_type', p_from_type));
    if v_fee > 0 then
      insert into wallet_ledger (wallet_id, amount, transaction_type, counterpart_id, reference_id, metadata)
      values (p_to_id, -v_fee, 'GIFT_FEE', p_from_id, p_reference_id, p_metadata || jsonb_build_object('fee_pct', fee_setting('gift_fee_pct', 5)));
    end if;
  else
    update page_wallets set balance = balance + v_net,
      withdrawable_balance = withdrawable_balance + case when v_earned then v_net else 0 end,
      updated_at = now()
    where page_id = p_to_id;
    insert into page_wallet_ledger (page_id, amount, transaction_type, counterpart_id, counterpart_type, operator_id, reference_id, metadata)
    values (p_to_id, p_amount, p_credit_type, p_from_id, p_from_type, p_operator, p_reference_id, p_metadata);
    if v_fee > 0 then
      insert into page_wallet_ledger (page_id, amount, transaction_type, counterpart_id, counterpart_type, operator_id, reference_id, metadata)
      values (p_to_id, -v_fee, 'GIFT_FEE', p_from_id, p_from_type, p_operator, p_reference_id, p_metadata || jsonb_build_object('fee_pct', fee_setting('gift_fee_pct', 5)));
    end if;
  end if;

  if p_from_type = 'USER' then
    select balance into v_balance from wallets where user_id = p_from_id and currency = 'PEW';
  else
    select balance into v_balance from page_wallets where page_id = p_from_id;
  end if;
  return v_balance;
end $$;

revoke all on function public.page_wallet_transfer(text, uuid, text, uuid, numeric, public.wallet_transaction_ledger_type, public.wallet_transaction_ledger_type, uuid, uuid, jsonb) from public, anon, authenticated;
