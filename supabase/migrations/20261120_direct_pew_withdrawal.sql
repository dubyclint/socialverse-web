-- Fruk: withdraw straight from PEW balance (deposits that never went through gifting).
alter table public.withdrawals add column if not exists direct_pewgift numeric not null default 0;

create table if not exists public.direct_pew_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  limit_pew numeric not null check (limit_pew >= 0),
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.direct_pew_limits enable row level security;

-- PEW still allowed for direct withdrawal in the rolling window (per-user override, else the admin default).
create or replace function public.direct_pew_allowance(p_user uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select greatest(
    coalesce((select limit_pew from direct_pew_limits where user_id = p_user), fee_setting('direct_pew_limit', 500))
    - coalesce((select sum(direct_pewgift) from withdrawals
                 where user_id = p_user and status <> 'failed'
                   and created_at > now() - make_interval(days => greatest(fee_setting('direct_pew_window_days', 30), 1)::int)), 0),
    0)
$$;
revoke all on function public.direct_pew_allowance(uuid) from public, anon, authenticated;

drop function if exists public.request_withdrawal(numeric, text, jsonb, uuid);
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount numeric, p_method text, p_details jsonb, p_user uuid DEFAULT NULL::uuid, p_use_direct boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := coalesce(auth.uid(), p_user);
  v_wallet wallets%rowtype;
  v_rate numeric := fee_setting('pew_usd_rate', 1);
  v_pew numeric;
  v_fee numeric;
  v_tax numeric;
  v_id uuid;
  v_direct numeric := 0;
  v_from_w numeric;
  v_short numeric;
  v_left numeric;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_method not in ('bank', 'crypto') then
    raise exception 'Choose bank or crypto' using errcode = '22023';
  end if;
  if p_amount is null or p_amount < fee_setting('min_withdrawal_pew', 10) then
    raise exception 'Minimum withdrawal is $%', fee_setting('min_withdrawal_pew', 10) using errcode = '22023';
  end if;

  perform ensure_wallet(v_user);
  select * into v_wallet from wallets where user_id = v_user and currency = 'PEW' for update;
  if v_wallet.is_locked then
    raise exception 'Your wallet is locked' using errcode = '55006';
  end if;
  v_pew := withdrawable_pew_for_usd(p_amount, v_wallet.withdrawable_balance);
  if v_wallet.withdrawable_balance < v_pew or v_wallet.balance < v_pew then
    if not p_use_direct then
      raise exception 'Amount exceeds your withdrawable balance' using errcode = '23514';
    end if;
    -- Cover the shortfall from deposited PEW that never went through gifting: gift fee + withdrawal fee apply.
    v_from_w := floor(v_wallet.withdrawable_balance * (1 - fee_setting('withdrawal_fee_pct', 37) / 100) * v_rate * 100) / 100;
    v_short := p_amount - v_from_w;
    v_direct := round(v_short / v_rate / (1 - fee_setting('gift_fee_pct', 5) / 100) / (1 - fee_setting('withdrawal_fee_pct', 37) / 100), 4);
    if v_direct > v_wallet.balance - v_wallet.withdrawable_balance then
      raise exception 'Amount exceeds your withdrawable and PEW balance' using errcode = '23514';
    end if;
    v_left := direct_pew_allowance(v_user);
    if v_direct > v_left then
      raise exception 'Direct PEW withdrawal limit reached: % PEW left in this period', round(v_left, 2) using errcode = '23514';
    end if;
    v_pew := v_wallet.withdrawable_balance + v_direct;
  end if;

  v_fee := round(v_pew - p_amount / v_rate, 4);
  v_tax := round(p_amount / v_rate * fee_setting('withdrawal_tax_pct', 0) / 100, 4);

  update wallets
     set balance = balance - v_pew, withdrawable_balance = withdrawable_balance - (v_pew - v_direct), updated_at = now()
   where user_id = v_user and currency = 'PEW';

  insert into withdrawals (user_id, amount, currency, status, method, details, destination, fee_pewgift, tax_pewgift, payout_usd, direct_pewgift)
  values (v_user, v_pew, 'PEW', 'pending', p_method, coalesce(p_details, '{}'::jsonb), p_method,
          v_fee, v_tax, round(p_amount - v_tax * v_rate, 2), v_direct)
  returning id into v_id;

  insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
  values (v_user, -v_pew, 'WITHDRAWAL', v_id, jsonb_build_object('withdrawal_id', v_id, 'usd', p_amount, 'fee', v_fee, 'tax', v_tax, 'method', p_method, 'direct_pew', v_direct));
  return v_id;
end $function$;
revoke all on function public.request_withdrawal(numeric, text, jsonb, uuid, boolean) from public, anon;

CREATE OR REPLACE FUNCTION public.resolve_withdrawal(p_id uuid, p_status text, p_note text DEFAULT NULL::text, p_admin uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_admin uuid := coalesce(auth.uid(), p_admin);
  v_row withdrawals%rowtype;
begin
  if auth.uid() is not null and not exists (select 1 from "user" where user_id = v_admin and role in ('admin', 'manager')) then
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
       set balance = balance + v_row.amount, withdrawable_balance = withdrawable_balance + (v_row.amount - coalesce(v_row.direct_pewgift, 0)), updated_at = now()
     where user_id = v_row.user_id and currency = 'PEW';
    insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
    values (v_row.user_id, v_row.amount, 'WITHDRAWAL_REFUND', p_id, jsonb_build_object('withdrawal_id', p_id, 'note', p_note));
  end if;

  update withdrawals
     set status = p_status, admin_note = coalesce(p_note, admin_note), reviewed_by = v_admin,
         processed_at = case when p_status in ('successful', 'failed') then now() else processed_at end,
         updated_at = now()
   where id = p_id;
end $function$;
