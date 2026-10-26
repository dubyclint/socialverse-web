-- P2P seller system (deposit + withdraw), dispute → support ticket, staff roles.
-- Convention: p2p_trades.seller_id is the party whose PEW sits in escrow,
-- buyer_id receives the PEW. Deposit: seller = merchant. Withdraw: seller = user.

create table if not exists public.staff_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('p2p_admin', 'support_agent', 'support_manager', 'dispute_decider')),
  languages text[] not null default '{en}',
  countries text[] not null default '{}',
  granted_by uuid,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.staff_roles enable row level security;

alter table public.seller_profiles add column if not exists display_name text;
alter table public.seller_profiles add column if not exists buyer_notes text;

alter table public.p2p_listings add column if not exists side text not null default 'sell';
do $$ begin
  alter table public.p2p_listings add constraint p2p_listings_side_chk check (side in ('sell', 'buy'));
exception when duplicate_object then null; end $$;

alter table public.p2p_trades add column if not exists kind text not null default 'deposit';
alter table public.p2p_trades add column if not exists merchant_id uuid;
alter table public.p2p_trades add column if not exists seller_confirmed_at timestamptz;
alter table public.p2p_trades add column if not exists dispute_opened_by uuid;
alter table public.p2p_trades add column if not exists dispute_opened_at timestamptz;
alter table public.p2p_trades add column if not exists support_ticket_id uuid;
alter table public.p2p_trades add column if not exists payout_details jsonb;
alter table public.p2p_trades add column if not exists decided_by uuid;
alter table public.p2p_trades add column if not exists decision_note text;
update public.p2p_trades set merchant_id = seller_id where merchant_id is null;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  counterparty_id uuid references auth.users(id) on delete set null,
  subject text not null,
  category text not null default 'general'
    check (category in ('general', 'account', 'wallet', 'p2p_dispute', 'escrow', 'verification', 'safety', 'other')),
  status text not null default 'open' check (status in ('open', 'pending', 'escalated', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  language text not null default 'en',
  country text,
  assigned_to uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  escalated_at timestamptz,
  escalation_note text,
  first_response_at timestamptz,
  resolved_at timestamptz,
  trade_id uuid references public.p2p_trades(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_queue_idx on public.support_tickets (status, assigned_to, created_at);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id);
create index if not exists support_tickets_cp_idx on public.support_tickets (counterparty_id);
alter table public.support_tickets enable row level security;

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null default '',
  attachments text[] not null default '{}',
  is_staff boolean not null default false,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
alter table public.support_messages enable row level security;

create table if not exists public.support_ticket_events (
  id bigserial primary key,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid,
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.support_ticket_events enable row level security;

create or replace function public.p2p_is_staff(p_actor uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public."user" where user_id = p_actor and role in ('admin', 'manager'))
      or exists (select 1 from public.staff_roles where user_id = p_actor and role in ('p2p_admin', 'dispute_decider', 'support_manager'));
$$;

-- Deposit: user buys PEW from a merchant's sell listing. 45-minute payment window, 5 PEW minimum.
create or replace function public.open_p2p_trade(p_listing_id uuid, p_buyer_id uuid, p_amount numeric)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_seller uuid; v_asset text; v_margin numeric; v_method uuid; v_side text;
  v_min numeric; v_max numeric; v_avail numeric;
  v_balance numeric; v_locked boolean; v_trade uuid; v_room uuid;
  v_rate numeric; v_platform_pct numeric; v_fee numeric; v_source numeric;
begin
  select seller_id, asset_code, margin_pct, payment_method_id, side, min_amount, max_amount, available_pewgift
    into v_seller, v_asset, v_margin, v_method, v_side, v_min, v_max, v_avail
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

  select coalesce(max(percent_rate), 0) into v_platform_pct from public.fee_settings where scope = 'deposit' and is_active;
  v_fee    := round(p_amount * v_platform_pct / 100, 4);
  v_source := round(p_amount * (1 + (v_margin + v_platform_pct) / 100) / v_rate, 8);

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

-- Withdraw: user sells PEW to a merchant's buy listing. Withdrawal fee + tax come off first.
create or replace function public.open_p2p_withdraw(p_listing_id uuid, p_user_id uuid, p_amount numeric, p_payout jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_merchant uuid; v_asset text; v_margin numeric; v_method uuid; v_side text;
  v_min numeric; v_max numeric; v_avail numeric; v_wallet record;
  v_rate numeric; v_fee numeric; v_net numeric; v_source numeric; v_trade uuid; v_room uuid;
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
    raise exception 'Minimum withdrawal is % PEW', greatest(public.fee_setting('min_withdrawal_pew', 10), 5) using errcode = '22023';
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
  if v_wallet.withdrawable_balance < p_amount or v_wallet.balance < p_amount then
    raise exception 'Amount exceeds your withdrawable balance' using errcode = '23514';
  end if;

  v_fee := round(p_amount * (public.fee_setting('withdrawal_fee_pct', 37) + public.fee_setting('withdrawal_tax_pct', 0)) / 100, 4);
  v_net := p_amount - v_fee;
  v_source := round(v_net * (1 - v_margin / 100) / v_rate, 8);

  update public.wallets set balance = balance - p_amount, withdrawable_balance = withdrawable_balance - p_amount,
         locked_balance = locked_balance + p_amount, updated_at = now() where user_id = p_user_id;
  update public.p2p_listings set available_pewgift = greatest(available_pewgift - p_amount, 0), updated_at = now() where id = p_listing_id;

  insert into public.chat_rooms (is_group_chat, created_by, room_name) values (false, p_user_id, 'P2P withdrawal') returning id into v_room;
  insert into public.chat_room_members (room_id, user_id) values (v_room, p_user_id), (v_room, v_merchant);

  insert into public.p2p_trades (seller_id, buyer_id, amount, status, listing_id, asset_code, source_amount, rate_used,
    margin_pct, fee_pewgift, payment_method_id, chat_room_id, expires_at, kind, merchant_id, payout_details)
  values (p_user_id, v_merchant, p_amount, 'funded', p_listing_id, v_asset, v_source, v_rate,
    v_margin, v_fee, v_method, v_room, now() + interval '45 minutes', 'withdraw', v_merchant, p_payout)
  returning id into v_trade;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (p_user_id, v_merchant, -p_amount, 'ESCROW_COLLATERAL_LOCK', v_trade, jsonb_build_object('listing_id', p_listing_id, 'kind', 'withdraw', 'fee', v_fee));
  return v_trade;
end;
$function$;

-- Step 1 of the escrow party's two-step confirmation.
create or replace function public.confirm_p2p_receipt(p_trade_id uuid, p_actor_id uuid)
returns timestamptz language plpgsql security definer set search_path to 'public' as $function$
declare v_t record;
begin
  select * into v_t from public.p2p_trades where id = p_trade_id for update;
  if v_t.id is null then raise exception 'trade not found' using errcode = 'P0002'; end if;
  if v_t.seller_id <> p_actor_id then raise exception 'only the party holding escrow confirms payment' using errcode = '42501'; end if;
  if v_t.status not in ('funded', 'disputed') then raise exception 'trade is not open' using errcode = '22023'; end if;
  if v_t.paid_declared_at is null then raise exception 'the other side has not marked the payment as sent yet' using errcode = '22023'; end if;
  update public.p2p_trades set seller_confirmed_at = coalesce(seller_confirmed_at, now()), updated_at = now() where id = p_trade_id;
  return now();
end;
$function$;

create or replace function public.release_p2p_trade(p_trade_id uuid, p_actor_id uuid)
returns numeric language plpgsql security definer set search_path to 'public' as $function$
declare v_t record; v_credit numeric;
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

  v_credit := v_t.amount - case when v_t.kind = 'withdraw' then v_t.fee_pewgift else 0 end;
  perform public.ensure_wallet(v_t.buyer_id);
  update public.wallets set locked_balance = locked_balance - v_t.amount, updated_at = now() where user_id = v_t.seller_id;
  update public.wallets set balance = balance + v_credit, updated_at = now() where user_id = v_t.buyer_id;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_t.buyer_id, v_t.seller_id, v_credit, 'ESCROW_MILESTONE_RELEASE', p_trade_id,
          jsonb_build_object('kind', v_t.kind, 'fee', case when v_t.kind = 'withdraw' then v_t.fee_pewgift else 0 end, 'by', p_actor_id));

  update public.p2p_trades set status = 'released', released_at = now(), updated_at = now() where id = p_trade_id;
  return v_credit;
end;
$function$;

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
    update public.p2p_listings set available_pewgift = available_pewgift + v_t.amount, updated_at = now() where id = v_t.listing_id;
  end if;
  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_t.seller_id, v_t.buyer_id, v_t.amount, 'ESCROW_DISPUTE_REFUND', p_trade_id,
          jsonb_build_object('reason', p_reason, 'kind', v_t.kind, 'by', p_actor_id));
  update public.p2p_trades set status = 'cancelled', dispute_reason = coalesce(p_reason, dispute_reason), updated_at = now() where id = p_trade_id;
  return v_t.amount;
end;
$function$;

-- Dispute after the 45-minute window. If both sides press within 5 seconds the buyer is recorded as the opener.
drop function if exists public.dispute_p2p_trade(uuid, uuid, text);
create function public.dispute_p2p_trade(p_trade_id uuid, p_actor_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_t record; v_ticket uuid; v_other uuid;
begin
  select * into v_t from public.p2p_trades where id = p_trade_id for update;
  if v_t.id is null then raise exception 'trade not found' using errcode = 'P0002'; end if;
  if p_actor_id not in (v_t.seller_id, v_t.buyer_id) then raise exception 'not a party to this trade' using errcode = '42501'; end if;
  v_other := case when p_actor_id = v_t.seller_id then v_t.buyer_id else v_t.seller_id end;

  if v_t.status = 'disputed' then
    if p_actor_id = v_t.buyer_id and v_t.dispute_opened_by = v_t.seller_id and now() - v_t.dispute_opened_at <= interval '5 seconds' then
      update public.p2p_trades set dispute_opened_by = p_actor_id, dispute_reason = p_reason, updated_at = now() where id = p_trade_id;
      update public.support_tickets set user_id = p_actor_id, counterparty_id = v_other, updated_at = now() where id = v_t.support_ticket_id;
      insert into public.support_ticket_events (ticket_id, actor_id, action, detail) values (v_t.support_ticket_id, p_actor_id, 'opener_buyer_priority', '{}');
    end if;
    return v_t.support_ticket_id;
  end if;
  if v_t.status <> 'funded' then raise exception 'trade is not open' using errcode = '22023'; end if;
  if now() < v_t.expires_at then raise exception 'You can open a dispute after the 45-minute payment window' using errcode = '22023'; end if;

  insert into public.support_tickets (user_id, counterparty_id, subject, category, priority, trade_id)
  values (p_actor_id, v_other, 'P2P ' || v_t.kind || ' dispute · ' || v_t.amount || ' PEW', 'p2p_dispute', 'high', p_trade_id)
  returning id into v_ticket;
  insert into public.support_messages (ticket_id, sender_id, body, is_system)
  values (v_ticket, p_actor_id, coalesce(nullif(trim(p_reason), ''), 'Dispute opened'), false),
         (v_ticket, null, 'Escrow is frozen. Support will review the trade chat and your evidence. Both sides can add proof here.', true);
  insert into public.support_ticket_events (ticket_id, actor_id, action, detail)
  values (v_ticket, p_actor_id, 'dispute_opened', jsonb_build_object('trade_id', p_trade_id, 'reason', p_reason));

  update public.p2p_trades set status = 'disputed', dispute_reason = p_reason, dispute_opened_by = p_actor_id,
         dispute_opened_at = now(), support_ticket_id = v_ticket, updated_at = now() where id = p_trade_id;

  insert into public.security_alerts (kind, actor_id, subject_id, severity, detail)
  values ('P2P_TRADE_DISPUTED', p_actor_id, p_trade_id, 'CRITICAL', jsonb_build_object('reason', p_reason, 'ticket', v_ticket));
  return v_ticket;
end;
$function$;


-- These RPCs trust p_actor_id, so only the server (service role) may call them.
revoke execute on function public.open_p2p_trade(uuid, uuid, numeric) from public, anon, authenticated;
revoke execute on function public.open_p2p_withdraw(uuid, uuid, numeric, jsonb) from public, anon, authenticated;
revoke execute on function public.confirm_p2p_receipt(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.release_p2p_trade(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancel_p2p_trade(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.dispute_p2p_trade(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.declare_p2p_paid(uuid, uuid) from public, anon, authenticated;
grant execute on function public.open_p2p_trade(uuid, uuid, numeric), public.open_p2p_withdraw(uuid, uuid, numeric, jsonb),
  public.confirm_p2p_receipt(uuid, uuid), public.release_p2p_trade(uuid, uuid), public.cancel_p2p_trade(uuid, uuid, text),
  public.dispute_p2p_trade(uuid, uuid, text), public.declare_p2p_paid(uuid, uuid) to service_role;
