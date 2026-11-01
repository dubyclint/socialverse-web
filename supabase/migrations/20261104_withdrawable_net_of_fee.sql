-- The withdrawable balance is shown in USD already net of the withdrawal fee, so withdrawals
-- are entered in that USD figure and never charged the fee a second time. The fee is taken
-- once, when withdrawable PEW converts to USD. Bank/crypto withdrawals pay only the admin-set
-- local tax (withdrawal_tax_pct, default 0); P2P withdrawals pay no further fee or tax.

create or replace function public.withdrawable_pew_for_usd(p_usd numeric, p_available numeric)
returns numeric language sql immutable as $$
  select case
    when v.pew > p_available and v.pew - p_available <= 0.01 then p_available
    else v.pew end
  from (select round(p_usd / public.fee_setting('pew_usd_rate', 1)
                     / (1 - public.fee_setting('withdrawal_fee_pct', 37) / 100), 4) as pew) v
$$;

create or replace function public.request_withdrawal(p_amount numeric, p_method text, p_details jsonb, p_user uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := coalesce(auth.uid(), p_user);
  v_wallet wallets%rowtype;
  v_rate numeric := fee_setting('pew_usd_rate', 1);
  v_pew numeric;
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
    raise exception 'Minimum withdrawal is $%', fee_setting('min_withdrawal_pew', 10) using errcode = '22023';
  end if;

  perform ensure_wallet(v_user);
  select * into v_wallet from wallets where user_id = v_user and currency = 'PEW' for update;
  if v_wallet.is_locked then
    raise exception 'Your wallet is locked' using errcode = '55006';
  end if;
  v_pew := withdrawable_pew_for_usd(p_amount, v_wallet.withdrawable_balance);
  if v_wallet.withdrawable_balance < v_pew or v_wallet.balance < v_pew then
    raise exception 'Amount exceeds your withdrawable balance' using errcode = '23514';
  end if;

  v_fee := round(v_pew - p_amount / v_rate, 4);
  v_tax := round(p_amount / v_rate * fee_setting('withdrawal_tax_pct', 0) / 100, 4);

  update wallets
     set balance = balance - v_pew, withdrawable_balance = withdrawable_balance - v_pew, updated_at = now()
   where user_id = v_user and currency = 'PEW';

  insert into withdrawals (user_id, amount, currency, status, method, details, destination, fee_pewgift, tax_pewgift, payout_usd)
  values (v_user, v_pew, 'PEW', 'pending', p_method, coalesce(p_details, '{}'::jsonb), p_method,
          v_fee, v_tax, round(p_amount - v_tax * v_rate, 2))
  returning id into v_id;

  insert into wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
  values (v_user, -v_pew, 'WITHDRAWAL', v_id, jsonb_build_object('withdrawal_id', v_id, 'usd', p_amount, 'fee', v_fee, 'tax', v_tax, 'method', p_method));
  return v_id;
end $$;
revoke execute on function public.request_withdrawal(numeric, text, jsonb, uuid) from public, anon;

-- P2P withdraw: p_amount is the USD (1 PEW = 1 USD) the merchant receives from the withdrawable balance.
create or replace function public.open_p2p_withdraw(p_listing_id uuid, p_user_id uuid, p_amount numeric, p_payout jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_merchant uuid; v_asset text; v_margin numeric; v_method uuid; v_side text;
  v_min numeric; v_max numeric; v_avail numeric; v_wallet record;
  v_rate numeric; v_fee numeric; v_pew numeric; v_source numeric; v_trade uuid; v_room uuid;
begin
  select seller_id, asset_code, margin_pct, payment_method_id, side, min_amount, max_amount, available_pewgift
    into v_merchant, v_asset, v_margin, v_method, v_side, v_min, v_max, v_avail
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

  v_fee := round(v_pew - p_amount, 4);
  v_source := round(p_amount * (1 - v_margin / 100) / v_rate, 8);

  update public.wallets set balance = balance - v_pew, withdrawable_balance = withdrawable_balance - v_pew,
         locked_balance = locked_balance + v_pew, updated_at = now() where user_id = p_user_id;
  update public.p2p_listings set available_pewgift = greatest(available_pewgift - p_amount, 0), updated_at = now() where id = p_listing_id;

  insert into public.chat_rooms (is_group_chat, created_by, room_name) values (false, p_user_id, 'P2P withdrawal') returning id into v_room;
  insert into public.chat_room_members (room_id, user_id) values (v_room, p_user_id), (v_room, v_merchant);

  insert into public.p2p_trades (seller_id, buyer_id, amount, status, listing_id, asset_code, source_amount, rate_used,
    margin_pct, fee_pewgift, payment_method_id, chat_room_id, expires_at, kind, merchant_id, payout_details)
  values (p_user_id, v_merchant, v_pew, 'funded', p_listing_id, v_asset, v_source, v_rate,
    v_margin, v_fee, v_method, v_room, now() + interval '45 minutes', 'withdraw', v_merchant, p_payout)
  returning id into v_trade;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (p_user_id, v_merchant, -v_pew, 'ESCROW_COLLATERAL_LOCK', v_trade, jsonb_build_object('listing_id', p_listing_id, 'kind', 'withdraw', 'usd', p_amount, 'fee', v_fee));
  return v_trade;
end;
$function$;

-- A cancelled withdrawal returns only the merchant's share to its offer.
create or replace function public.cancel_p2p_trade(p_trade_id uuid, p_actor_id uuid, p_reason text default null)
returns numeric language plpgsql security definer set search_path to 'public' as $function$
declare v_t record;
begin
  select * into v_t from public.p2p_trades where id = p_trade_id for update;
  if v_t.id is null then raise exception 'trade not found' using errcode = 'P0002'; end if;
  if v_t.status = 'cancelled' then return v_t.amount; end if;
  if v_t.status not in ('created', 'funded', 'disputed') then raise exception 'trade cannot be cancelled' using errcode = '22023'; end if;

  if v_t.status = 'disputed' then
    if not public.p2p_is_staff(p_actor_id) and p_actor_id <> v_t.buyer_id then
      raise exception 'a dispute is open; support decides this trade' using errcode = '42501';
    end if;
  elsif p_actor_id = v_t.buyer_id then
    null; -- the side receiving PEW can always back out before release
  elsif p_actor_id = v_t.seller_id then
    if v_t.paid_declared_at is not null or now() < v_t.expires_at then
      raise exception 'you can cancel only after the 45-minute window if no payment was marked' using errcode = '42501';
    end if;
  elsif not public.p2p_is_staff(p_actor_id) then
    raise exception 'not authorised to cancel this trade' using errcode = '42501';
  end if;

  update public.wallets
     set locked_balance = locked_balance - v_t.amount, balance = balance + v_t.amount,
         withdrawable_balance = withdrawable_balance + case when v_t.kind = 'withdraw' then v_t.amount else 0 end,
         updated_at = now()
   where user_id = v_t.seller_id;
  if v_t.listing_id is not null then
    update public.p2p_listings set available_pewgift = available_pewgift + v_t.amount - case when v_t.kind = 'withdraw' then coalesce(v_t.fee_pewgift, 0) else 0 end, updated_at = now() where id = v_t.listing_id;
  end if;
  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_t.seller_id, v_t.buyer_id, v_t.amount, 'ESCROW_DISPUTE_REFUND', p_trade_id,
          jsonb_build_object('reason', p_reason, 'kind', v_t.kind, 'by', p_actor_id));
  update public.p2p_trades set status = 'cancelled', dispute_reason = coalesce(p_reason, dispute_reason), updated_at = now() where id = p_trade_id;
  return v_t.amount;
end;
$function$;
