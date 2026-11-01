-- Admin-set P2P deposit and P2P withdrawal fees (fee_settings keys p2p_deposit_fee_pct / p2p_withdrawal_fee_pct, default 0),
-- and an optional local tax % sellers can set per offer (paid by the buyer on deposits, taken from the payout on withdrawals).
alter table public.p2p_listings add column if not exists tax_pct numeric not null default 0;
alter table public.p2p_listings drop constraint if exists p2p_listings_tax_pct_check;
alter table public.p2p_listings add constraint p2p_listings_tax_pct_check check (tax_pct >= 0 and tax_pct <= 30);

CREATE OR REPLACE FUNCTION public.open_p2p_trade(p_listing_id uuid, p_buyer_id uuid, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_seller uuid; v_asset text; v_margin numeric; v_method uuid; v_side text;
  v_min numeric; v_max numeric; v_avail numeric;
  v_balance numeric; v_locked boolean; v_trade uuid; v_room uuid;
  v_rate numeric; v_platform_pct numeric; v_tax numeric; v_fee numeric; v_source numeric;
begin
  select seller_id, asset_code, margin_pct, payment_method_id, side, min_amount, max_amount, available_pewgift, coalesce(tax_pct, 0)
    into v_seller, v_asset, v_margin, v_method, v_side, v_min, v_max, v_avail, v_tax
  from public.p2p_listings where id = p_listing_id and is_active for update;

  if v_seller is null then raise exception 'listing not found' using errcode = 'P0002'; end if;
  if v_side <> 'sell' then raise exception 'this offer is for withdrawals' using errcode = '22023'; end if;
  if v_seller = p_buyer_id then raise exception 'cannot trade with yourself' using errcode = '22023'; end if;
  if p_amount is null or p_amount < 5 then raise exception 'Minimum P2P deposit is 5 PEW' using errcode = '22023'; end if;
  if p_amount < v_min or p_amount > v_max then
    raise exception 'Amount must be between % and % PEW for this seller', v_min, v_max using errcode = '22023';
  end if;
  if not exists (select 1 from public.seller_profiles where user_id = v_seller and is_active and revoked_at is null) then
    raise exception 'seller is not active' using errcode = '22023';
  end if;

  select reference_rate into v_rate from public.supported_assets where code = v_asset and is_enabled;
  if v_rate is null then raise exception 'currency is not available' using errcode = '22023'; end if;

  v_platform_pct := public.fee_setting('p2p_deposit_fee_pct', (select coalesce(max(percent_rate), 0) from public.fee_settings where scope = 'deposit' and is_active));
  v_fee    := round(p_amount * v_platform_pct / 100, 4);
  v_source := round(p_amount * (1 + (v_margin + v_platform_pct + v_tax) / 100) / v_rate, 8);

  perform public.ensure_wallet(v_seller);
  select balance, is_locked into v_balance, v_locked from public.wallets where user_id = v_seller for update;
  if v_locked then raise exception 'seller balance is locked' using errcode = '55006'; end if;
  if v_balance < p_amount then raise exception 'seller has insufficient PEW for this amount' using errcode = '23514'; end if;

  update public.wallets set balance = balance - p_amount, locked_balance = locked_balance + p_amount, updated_at = now()
   where user_id = v_seller;
  update public.p2p_listings set available_pewgift = greatest(available_pewgift - p_amount, 0), updated_at = now()
   where id = p_listing_id;

  insert into public.chat_rooms (is_group_chat, created_by, room_name) values (false, p_buyer_id, 'P2P trade') returning id into v_room;
  insert into public.chat_room_members (room_id, user_id) values (v_room, p_buyer_id), (v_room, v_seller);

  insert into public.p2p_trades (seller_id, buyer_id, amount, status, listing_id, asset_code, source_amount, rate_used,
    margin_pct, fee_pewgift, payment_method_id, chat_room_id, expires_at, kind, merchant_id)
  values (v_seller, p_buyer_id, p_amount, 'funded', p_listing_id, v_asset, v_source, v_rate,
    v_margin, v_fee, v_method, v_room, now() + interval '45 minutes', 'deposit', v_seller)
  returning id into v_trade;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_seller, p_buyer_id, -p_amount, 'ESCROW_COLLATERAL_LOCK', v_trade, jsonb_build_object('listing_id', p_listing_id, 'kind', 'deposit'));
  return v_trade;
end;
$function$;

create or replace function public.open_p2p_withdraw(p_listing_id uuid, p_user_id uuid, p_amount numeric, p_payout jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_merchant uuid; v_asset text; v_margin numeric; v_method uuid; v_side text;
  v_min numeric; v_max numeric; v_avail numeric; v_wallet record;
  v_rate numeric; v_fee numeric; v_pfee numeric; v_tax numeric; v_pew numeric; v_source numeric; v_trade uuid; v_room uuid;
begin
  select seller_id, asset_code, margin_pct, payment_method_id, side, min_amount, max_amount, available_pewgift, coalesce(tax_pct, 0)
    into v_merchant, v_asset, v_margin, v_method, v_side, v_min, v_max, v_avail, v_tax
  from public.p2p_listings where id = p_listing_id and is_active for update;

  if v_merchant is null then raise exception 'offer not found' using errcode = 'P0002'; end if;
  if v_side <> 'buy' then raise exception 'this offer is for deposits' using errcode = '22023'; end if;
  if v_merchant = p_user_id then raise exception 'cannot trade with yourself' using errcode = '22023'; end if;
  if p_payout is null or coalesce(p_payout->>'account', '') = '' then
    raise exception 'Enter the account the seller should pay you on' using errcode = '22023';
  end if;
  if p_amount is null or p_amount < greatest(public.fee_setting('min_withdrawal_pew', 10), 5) then
    raise exception 'Minimum withdrawal is $%', greatest(public.fee_setting('min_withdrawal_pew', 10), 5) using errcode = '22023';
  end if;
  if p_amount < v_min or p_amount > v_max or p_amount > v_avail then
    raise exception 'This seller takes between % and % PEW right now', v_min, least(v_max, v_avail) using errcode = '22023';
  end if;
  if not exists (select 1 from public.seller_profiles where user_id = v_merchant and is_active and revoked_at is null) then
    raise exception 'seller is not active' using errcode = '22023';
  end if;

  select reference_rate into v_rate from public.supported_assets where code = v_asset and is_enabled;
  if v_rate is null then raise exception 'currency is not available' using errcode = '22023'; end if;

  perform public.ensure_wallet(p_user_id);
  select * into v_wallet from public.wallets where user_id = p_user_id for update;
  if v_wallet.is_locked then raise exception 'Your wallet is locked' using errcode = '55006'; end if;
  v_pew := public.withdrawable_pew_for_usd(p_amount, v_wallet.withdrawable_balance);
  if v_wallet.withdrawable_balance < v_pew or v_wallet.balance < v_pew then
    raise exception 'Amount exceeds your withdrawable balance' using errcode = '23514';
  end if;

  v_pfee := round(p_amount * public.fee_setting('p2p_withdrawal_fee_pct', 0) / 100, 4);
  v_fee := round(v_pew - p_amount + v_pfee, 4);
  v_source := round((p_amount - v_pfee) * (1 - (v_margin + v_tax) / 100) / v_rate, 8);

  update public.wallets set balance = balance - v_pew, withdrawable_balance = withdrawable_balance - v_pew,
         locked_balance = locked_balance + v_pew, updated_at = now() where user_id = p_user_id;
  update public.p2p_listings set available_pewgift = greatest(available_pewgift - (p_amount - v_pfee), 0), updated_at = now() where id = p_listing_id;

  insert into public.chat_rooms (is_group_chat, created_by, room_name) values (false, p_user_id, 'P2P withdrawal') returning id into v_room;
  insert into public.chat_room_members (room_id, user_id) values (v_room, p_user_id), (v_room, v_merchant);

  insert into public.p2p_trades (seller_id, buyer_id, amount, status, listing_id, asset_code, source_amount, rate_used,
    margin_pct, fee_pewgift, payment_method_id, chat_room_id, expires_at, kind, merchant_id, payout_details)
  values (p_user_id, v_merchant, v_pew, 'funded', p_listing_id, v_asset, v_source, v_rate,
    v_margin, v_fee, v_method, v_room, now() + interval '45 minutes', 'withdraw', v_merchant, p_payout)
  returning id into v_trade;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (p_user_id, v_merchant, -v_pew, 'ESCROW_COLLATERAL_LOCK', v_trade, jsonb_build_object('listing_id', p_listing_id, 'kind', 'withdraw', 'usd', p_amount, 'fee', v_fee, 'p2p_fee', v_pfee, 'seller_tax_pct', v_tax));
  return v_trade;
end;
$function$;
