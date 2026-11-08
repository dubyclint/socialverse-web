-- Fruk: the add-funds fee % now applies to P2P deposits too, deducted from the PEW credited
-- (like Flutterwave/NowPayments/Paystack via settle_deposit) instead of being priced into fiat.
alter table public.p2p_trades add column if not exists fee_deducted boolean not null default false;

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

  -- The add-funds fee applies to every deposit method; the P2P fee is an optional extra (default 0).
  v_platform_pct := public.fee_setting('deposit_fee_pct', 1.2) + greatest(public.fee_setting('p2p_deposit_fee_pct', 0), 0);
  v_fee    := round(p_amount * v_platform_pct / 100, 4);
  v_source := round(p_amount * (1 + (v_margin + v_tax) / 100) / v_rate, 8);

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
    margin_pct, fee_pewgift, payment_method_id, chat_room_id, expires_at, kind, merchant_id, fee_deducted)
  values (v_seller, p_buyer_id, p_amount, 'funded', p_listing_id, v_asset, v_source, v_rate,
    v_margin, v_fee, v_method, v_room, now() + interval '45 minutes', 'deposit', v_seller, true)
  returning id into v_trade;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_seller, p_buyer_id, -p_amount, 'ESCROW_COLLATERAL_LOCK', v_trade, jsonb_build_object('listing_id', p_listing_id, 'kind', 'deposit'));
  return v_trade;
end;
$function$;

CREATE OR REPLACE FUNCTION public.release_p2p_trade(p_trade_id uuid, p_actor_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_t record; v_credit numeric; v_fee numeric;
begin
  select * into v_t from public.p2p_trades where id = p_trade_id for update;
  if v_t.id is null then raise exception 'trade not found' using errcode = 'P0002'; end if;
  if v_t.status = 'released' then return v_t.amount; end if;
  if v_t.status not in ('funded', 'disputed') then raise exception 'trade is not releasable' using errcode = '22023'; end if;

  if p_actor_id = v_t.seller_id then
    if v_t.seller_confirmed_at is null then raise exception 'confirm the payment first' using errcode = '22023'; end if;
  elsif not (v_t.status = 'disputed' and public.p2p_is_staff(p_actor_id)) then
    raise exception 'not authorised to release this trade' using errcode = '42501';
  end if;

  v_fee := case when v_t.kind = 'withdraw' or coalesce(v_t.fee_deducted, false) then coalesce(v_t.fee_pewgift, 0) else 0 end;
  v_credit := v_t.amount - v_fee;
  perform public.ensure_wallet(v_t.buyer_id);
  update public.wallets set locked_balance = locked_balance - v_t.amount, updated_at = now() where user_id = v_t.seller_id;
  update public.wallets set balance = balance + v_credit, updated_at = now() where user_id = v_t.buyer_id;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_t.buyer_id, v_t.seller_id, case when v_t.kind = 'deposit' and v_fee > 0 then v_t.amount else v_credit end, 'ESCROW_MILESTONE_RELEASE', p_trade_id,
          jsonb_build_object('kind', v_t.kind, 'fee', v_fee, 'by', p_actor_id));
  if v_t.kind = 'deposit' and v_fee > 0 then
    insert into public.wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
    values (v_t.buyer_id, -v_fee, 'DEPOSIT_FEE', p_trade_id, jsonb_build_object('route', 'P2P', 'fee_pewgift', v_fee));
  end if;

  update public.p2p_trades set status = 'released', released_at = now(), updated_at = now() where id = p_trade_id;
  return v_credit;
end;
$function$;
