alter table public.badge_requests
  add column if not exists plan text check (plan in ('monthly', 'yearly')),
  add column if not exists tier text,
  add column if not exists fee_paid numeric not null default 0;

create or replace function public.verification_fee_charge(p_user uuid, p_page uuid, p_amount numeric, p_request uuid)
returns numeric language plpgsql security definer set search_path to 'public' as $$
declare v_balance numeric; v_locked boolean;
begin
  if p_amount is null or p_amount < 0 then raise exception 'invalid fee' using errcode = '22023'; end if;
  if p_amount = 0 then return 0; end if;
  if p_page is not null then
    insert into page_wallets (page_id) values (p_page) on conflict do nothing;
    select balance, is_locked into v_balance, v_locked from page_wallets where page_id = p_page for update;
    if v_locked then raise exception 'wallet is locked' using errcode = '55006'; end if;
    if v_balance < p_amount then raise exception 'insufficient balance' using errcode = '23514'; end if;
    update page_wallets set balance = balance - p_amount,
      withdrawable_balance = least(withdrawable_balance, balance - p_amount), updated_at = now()
    where page_id = p_page;
    insert into page_wallet_ledger (page_id, amount, transaction_type, operator_id, reference_id, metadata)
    values (p_page, -p_amount, 'VERIFICATION_FEE', p_user, p_request, jsonb_build_object('kind', 'verification_fee'));
  else
    perform ensure_wallet(p_user);
    select balance, is_locked into v_balance, v_locked from wallets where user_id = p_user and currency = 'PEW' for update;
    if v_locked then raise exception 'wallet is locked' using errcode = '55006'; end if;
    if v_balance < p_amount then raise exception 'insufficient balance' using errcode = '23514'; end if;
    update wallets set balance = balance - p_amount,
      withdrawable_balance = least(withdrawable_balance, balance - p_amount), updated_at = now()
    where user_id = p_user and currency = 'PEW';
    insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
    values (p_user, -p_amount, 'VERIFICATION_FEE', p_request, jsonb_build_object('kind', 'verification_fee'));
  end if;
  update badge_requests set fee_paid = p_amount where id = p_request;
  return p_amount;
end $$;
revoke all on function public.verification_fee_charge(uuid, uuid, numeric, uuid) from public, anon, authenticated;
grant execute on function public.verification_fee_charge(uuid, uuid, numeric, uuid) to service_role;
