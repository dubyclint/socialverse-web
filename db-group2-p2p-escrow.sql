-- =============================================================================
-- Group 2.2 — P2P / B2P deposit matching, seller listings and trade escrow
-- =============================================================================
-- Buyers pay sellers off-platform (local fiat or crypto); the platform only ever
-- moves internal Pewgift credits, which are held in the seller's own wallet as
-- `locked_balance` for the duration of the trade. Zero custody of external
-- assets is preserved.
--
-- Selling is a privilege: only users an admin/manager has granted a seller
-- profile to can list. Listings freeze while a trade is active and for the
-- risk window preceding it; attempted edits raise an admin alert.
--
-- Additive and idempotent. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. admin-configured assets and currencies
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.p2p_asset_kind as enum ('FIAT', 'CRYPTO');
exception when duplicate_object then null; end $$;

create table if not exists public.supported_assets (
  code          text primary key,                  -- USDT | BTC | TON | NGN | EUR ...
  kind          public.p2p_asset_kind not null,
  display_name  text        not null,
  network       text,                              -- crypto only: TRC20 | ERC20 | TON ...
  decimals      smallint    not null default 2 check (decimals between 0 and 18),
  -- USD per unit of the asset. Admin-maintained until a live rate feed is
  -- wired in; the trade snapshots it as p2p_trades.rate_used at open time.
  reference_rate numeric(24,8) not null default 1 check (reference_rate > 0),
  rate_updated_at timestamptz not null default now(),
  min_deposit   numeric(24,8) not null default 0,
  max_deposit   numeric(24,8),
  is_enabled    boolean     not null default true,
  sort_order    smallint    not null default 100,
  updated_at    timestamptz not null default now(),
  check (max_deposit is null or max_deposit > min_deposit)
);

alter table public.supported_assets add column if not exists reference_rate  numeric(24,8) not null default 1;
alter table public.supported_assets add column if not exists rate_updated_at timestamptz not null default now();

-- Product cap: at most 20 crypto assets may be enabled at any time.
create or replace function public.enforce_crypto_asset_cap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.kind = 'CRYPTO' and new.is_enabled
     and (select count(*) from public.supported_assets
          where kind = 'CRYPTO' and is_enabled and code <> new.code) >= 20 then
    raise exception 'at most 20 crypto assets may be enabled' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists supported_assets_crypto_cap on public.supported_assets;
create trigger supported_assets_crypto_cap
  before insert or update on public.supported_assets
  for each row execute function public.enforce_crypto_asset_cap();

-- ---------------------------------------------------------------------------
-- 2. seller privilege and payout methods
-- ---------------------------------------------------------------------------

create table if not exists public.seller_profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  is_active      boolean     not null default true,
  max_margin_pct numeric(5,2) not null default 3.00 check (max_margin_pct between 0 and 100),
  granted_by     uuid        not null references auth.users (id),
  granted_at     timestamptz not null default now(),
  revoked_at     timestamptz,
  notes          text
);

do $$ begin
  create type public.seller_method_kind as enum ('BANK', 'CRYPTO', 'CUSTOM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.seller_method_state as enum ('PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null; end $$;

-- Method 1 (BANK/CRYPTO) needs admin verification against KYC identity;
-- method 2 (CUSTOM) is free-text instructions, also admin approved.
create table if not exists public.seller_payment_methods (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid        not null references public.seller_profiles (user_id) on delete cascade,
  kind          public.seller_method_kind not null,
  asset_code    text        references public.supported_assets (code),
  account_name  text,
  account_ref   text,                              -- account number or wallet address
  bank_name     text,
  network       text,
  instructions  text        check (instructions is null or char_length(instructions) <= 400),
  status        public.seller_method_state not null default 'PENDING',
  reviewed_by   uuid        references auth.users (id),
  reviewed_at   timestamptz,
  rejection_reason text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (kind <> 'CUSTOM' or instructions is not null),
  check (kind = 'CUSTOM' or (account_name is not null and account_ref is not null))
);

create index if not exists seller_payment_methods_seller_idx
  on public.seller_payment_methods (seller_id, status);

-- ---------------------------------------------------------------------------
-- 3. listings
-- ---------------------------------------------------------------------------

create table if not exists public.p2p_listings (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid        not null references public.seller_profiles (user_id) on delete cascade,
  asset_code      text        not null references public.supported_assets (code),
  margin_pct      numeric(5,2) not null default 0 check (margin_pct >= 0),
  min_amount      numeric(20,4) not null default 1 check (min_amount > 0),
  max_amount      numeric(20,4) not null,
  available_pewgift numeric(20,4) not null default 0 check (available_pewgift >= 0),
  payment_method_id uuid      references public.seller_payment_methods (id) on delete set null,
  alt_payment_method_id uuid  references public.seller_payment_methods (id) on delete set null,
  terms           text        check (terms is null or char_length(terms) <= 400),
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (max_amount >= min_amount)
);

create index if not exists p2p_listings_match_idx
  on public.p2p_listings (asset_code, is_active, margin_pct);

-- ---------------------------------------------------------------------------
-- 4. trades — extends the existing p2p_trades state machine
-- ---------------------------------------------------------------------------

alter table public.p2p_trades add column if not exists listing_id      uuid references public.p2p_listings (id) on delete set null;
alter table public.p2p_trades add column if not exists asset_code      text references public.supported_assets (code);
alter table public.p2p_trades add column if not exists source_amount   numeric(24,8);
alter table public.p2p_trades add column if not exists rate_used       numeric(24,8);
alter table public.p2p_trades add column if not exists margin_pct      numeric(5,2) not null default 0;
alter table public.p2p_trades add column if not exists fee_pewgift     numeric(20,4) not null default 0;
alter table public.p2p_trades add column if not exists payment_method_id uuid references public.seller_payment_methods (id) on delete set null;
alter table public.p2p_trades add column if not exists chat_room_id    uuid references public.chat_rooms (id) on delete set null;
alter table public.p2p_trades add column if not exists paid_declared_at timestamptz;
alter table public.p2p_trades add column if not exists released_at     timestamptz;
alter table public.p2p_trades add column if not exists expires_at      timestamptz;
alter table public.p2p_trades add column if not exists dispute_reason  text;

create index if not exists p2p_trades_open_idx
  on public.p2p_trades (seller_id, status) where status in ('created', 'funded', 'disputed');

-- ---------------------------------------------------------------------------
-- 5. anti-race listing freeze
-- ---------------------------------------------------------------------------
-- A seller may not change price, margin, asset or payout details while a trade
-- is open, nor within the risk window before one. Attempts are recorded and
-- alerted on rather than silently rejected.

create table if not exists public.security_alerts (
  id          uuid primary key default gen_random_uuid(),
  kind        text        not null,
  actor_id    uuid        references auth.users (id) on delete set null,
  subject_id  uuid,
  severity    text        not null default 'WARNING',
  detail      jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists security_alerts_recent_idx on public.security_alerts (created_at desc);

create or replace function public.seller_is_frozen(p_seller_id uuid, p_window interval default interval '3 hours')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.p2p_trades
    where seller_id = p_seller_id
      and (status in ('created', 'funded', 'disputed')
           or updated_at > now() - p_window)
  );
$$;

create or replace function public.guard_listing_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sensitive boolean;
begin
  v_sensitive := tg_op = 'DELETE' or new.margin_pct       is distinct from old.margin_pct
                                  or new.asset_code       is distinct from old.asset_code
                                  or new.min_amount       is distinct from old.min_amount
                                  or new.max_amount       is distinct from old.max_amount
                                  or new.payment_method_id is distinct from old.payment_method_id
                                  or new.alt_payment_method_id is distinct from old.alt_payment_method_id;

  if v_sensitive and public.seller_is_frozen(old.seller_id) then
    insert into public.security_alerts (kind, actor_id, subject_id, severity, detail)
    values (
      'P2P_LISTING_FROZEN_EDIT_ATTEMPT',
      auth.uid(),
      old.seller_id,
      'CRITICAL',
      jsonb_build_object('listing_id', old.id, 'operation', tg_op)
    );

    -- Neutralise rather than raise: an exception would roll the alert back with
    -- the statement, and the alert is the point. Callers must check
    -- seller_is_frozen() up front and surface 423 to the seller.
    if tg_op = 'DELETE' then
      return null;
    end if;

    new.margin_pct            := old.margin_pct;
    new.asset_code            := old.asset_code;
    new.min_amount            := old.min_amount;
    new.max_amount            := old.max_amount;
    new.payment_method_id     := old.payment_method_id;
    new.alt_payment_method_id := old.alt_payment_method_id;
    return new;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists p2p_listings_freeze on public.p2p_listings;
create trigger p2p_listings_freeze
  before update or delete on public.p2p_listings
  for each row execute function public.guard_listing_mutation();

-- ---------------------------------------------------------------------------
-- 6. matching
-- ---------------------------------------------------------------------------
-- Ranked by the product's priority hierarchy: seller privilege, asset match,
-- lowest effective price, verification badge, then alternative payment cover.

drop function if exists public.match_p2p_sellers(text, numeric, integer);

create or replace function public.match_p2p_sellers(
  p_asset_code text,
  p_amount     numeric,
  p_limit      integer default 20
) returns table (
  listing_id        uuid,
  seller_id         uuid,
  username          text,
  is_verified       boolean,
  role              public.user_role,
  margin_pct        numeric,
  effective_rate    numeric,
  reference_rate    numeric,
  price_per_pewgift numeric,
  quote_amount      numeric,
  available_pewgift numeric,
  has_alt_method    boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with platform_fee as (
    select coalesce(max(percent_rate), 0) as pct
    from public.fee_settings
    where scope = 'deposit' and is_active
  )
  select l.id,
         l.seller_id,
         u.username,
         u.is_verified,
         u.role,
         l.margin_pct,
         round(1 + (l.margin_pct + f.pct) / 100, 8) as effective_rate,
         a.reference_rate,
         round((1 + (l.margin_pct + f.pct) / 100) / a.reference_rate, 8) as price_per_pewgift,
         round(p_amount * (1 + (l.margin_pct + f.pct) / 100) / a.reference_rate, 8) as quote_amount,
         l.available_pewgift,
         l.alt_payment_method_id is not null
  from public.p2p_listings l
  join public.seller_profiles s on s.user_id = l.seller_id
  join public."user" u          on u.user_id = l.seller_id
  join public.supported_assets a on a.code = l.asset_code
  cross join platform_fee f
  where l.is_active
    and s.is_active and s.revoked_at is null
    and a.is_enabled
    and l.asset_code = p_asset_code
    and p_amount between l.min_amount and l.max_amount
    and l.available_pewgift >= p_amount
    and not u.is_banned
    and not public.seller_is_frozen(l.seller_id, interval '0')
  order by (u.role in ('admin', 'manager')) desc,
           (l.margin_pct + f.pct) asc,
           u.is_verified desc,
           (l.alt_payment_method_id is not null) desc,
           l.updated_at desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- 7. trade lifecycle — credits are locked in the seller's own wallet
-- ---------------------------------------------------------------------------

drop function if exists public.open_p2p_trade(uuid, uuid, numeric, numeric, numeric);

-- The buyer states how many Pewgift they want; price, fee and the amount owed
-- in the local asset are all derived server-side and snapshotted on the trade.
create or replace function public.open_p2p_trade(
  p_listing_id uuid,
  p_buyer_id   uuid,
  p_amount     numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_asset  text;
  v_margin numeric;
  v_method uuid;
  v_balance numeric;
  v_locked  boolean;
  v_trade  uuid;
  v_room   uuid;
  v_rate   numeric;
  v_platform_pct numeric;
  v_fee    numeric;
  v_source numeric;
begin
  select seller_id, asset_code, margin_pct, payment_method_id
    into v_seller, v_asset, v_margin, v_method
  from public.p2p_listings where id = p_listing_id for update;

  if v_seller is null then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;
  if v_seller = p_buyer_id then
    raise exception 'cannot trade with yourself' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive' using errcode = '22023';
  end if;

  select reference_rate into v_rate
  from public.supported_assets where code = v_asset and is_enabled;

  if v_rate is null then
    raise exception 'asset is not available' using errcode = '22023';
  end if;

  select coalesce(max(percent_rate), 0) into v_platform_pct
  from public.fee_settings where scope = 'deposit' and is_active;

  v_fee    := round(p_amount * v_platform_pct / 100, 4);
  v_source := round(p_amount * (1 + (v_margin + v_platform_pct) / 100) / v_rate, 8);

  perform public.ensure_wallet(v_seller);
  select balance, is_locked into v_balance, v_locked
  from public.wallets where user_id = v_seller for update;

  if v_locked then
    raise exception 'seller balance is locked' using errcode = '55006';
  end if;
  if v_balance < p_amount then
    raise exception 'seller has insufficient credits' using errcode = '23514';
  end if;

  -- Escrow: credits leave the spendable balance but stay with the seller until
  -- the buyer's off-platform payment is confirmed.
  update public.wallets
     set balance = balance - p_amount,
         locked_balance = locked_balance + p_amount,
         updated_at = now()
   where user_id = v_seller;

  update public.p2p_listings
     set available_pewgift = greatest(available_pewgift - p_amount, 0),
         updated_at = now()
   where id = p_listing_id;

  insert into public.chat_rooms (is_group_chat, created_by, room_name)
  values (false, p_buyer_id, 'P2P trade')
  returning id into v_room;

  insert into public.chat_room_members (room_id, user_id)
  values (v_room, p_buyer_id), (v_room, v_seller);

  insert into public.p2p_trades (
    seller_id, buyer_id, amount, status, listing_id, asset_code,
    source_amount, rate_used, margin_pct, fee_pewgift, payment_method_id, chat_room_id, expires_at
  ) values (
    v_seller, p_buyer_id, p_amount, 'funded', p_listing_id, v_asset,
    v_source, v_rate, v_margin, v_fee, v_method, v_room, now() + interval '30 minutes'
  ) returning id into v_trade;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_seller, p_buyer_id, -p_amount, 'ESCROW_COLLATERAL_LOCK', v_trade,
          jsonb_build_object('listing_id', p_listing_id));

  return v_trade;
end;
$$;

-- Buyer declares the off-platform payment sent; this only timestamps the trade,
-- the credits stay locked until the seller (or an admin) releases.
create or replace function public.declare_p2p_paid(p_trade_id uuid, p_actor_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer  uuid;
  v_status public.p2p_trade_status;
  v_paid   timestamptz;
begin
  select buyer_id, status, paid_declared_at
    into v_buyer, v_status, v_paid
  from public.p2p_trades where id = p_trade_id for update;

  if v_buyer is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;
  if v_buyer <> p_actor_id then
    raise exception 'only the buyer can declare payment' using errcode = '42501';
  end if;
  if v_status <> 'funded' then
    raise exception 'trade is not awaiting payment' using errcode = '22023';
  end if;
  if v_paid is not null then
    return v_paid;
  end if;

  update public.p2p_trades
     set paid_declared_at = now(), updated_at = now()
   where id = p_trade_id
  returning paid_declared_at into v_paid;

  return v_paid;
end;
$$;

create or replace function public.release_p2p_trade(p_trade_id uuid, p_actor_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_buyer  uuid;
  v_amount numeric;
  v_status public.p2p_trade_status;
begin
  select seller_id, buyer_id, amount, status
    into v_seller, v_buyer, v_amount, v_status
  from public.p2p_trades where id = p_trade_id for update;

  if v_seller is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;
  if v_status = 'released' then
    return v_amount;
  end if;
  if v_status <> 'funded' then
    raise exception 'trade is not releasable' using errcode = '22023';
  end if;

  -- Only the seller confirms receipt of the off-platform payment; an
  -- admin/manager may release on their behalf when resolving a dispute.
  if p_actor_id <> v_seller
     and not exists (select 1 from public."user" where user_id = p_actor_id and role in ('admin', 'manager')) then
    raise exception 'not authorised to release this trade' using errcode = '42501';
  end if;

  perform public.ensure_wallet(v_buyer);

  update public.wallets
     set locked_balance = locked_balance - v_amount, updated_at = now()
   where user_id = v_seller;

  update public.wallets
     set balance = balance + v_amount, updated_at = now()
   where user_id = v_buyer;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_buyer, v_seller, v_amount, 'ESCROW_MILESTONE_RELEASE', p_trade_id, '{}'::jsonb);

  update public.p2p_trades
     set status = 'released', released_at = now(), updated_at = now()
   where id = p_trade_id;

  return v_amount;
end;
$$;

create or replace function public.cancel_p2p_trade(p_trade_id uuid, p_actor_id uuid, p_reason text default null)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_buyer  uuid;
  v_amount numeric;
  v_status public.p2p_trade_status;
  v_listing uuid;
begin
  select seller_id, buyer_id, amount, status, listing_id
    into v_seller, v_buyer, v_amount, v_status, v_listing
  from public.p2p_trades where id = p_trade_id for update;

  if v_seller is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;
  if v_status = 'cancelled' then
    return v_amount;
  end if;
  if v_status not in ('created', 'funded', 'disputed') then
    raise exception 'trade cannot be cancelled' using errcode = '22023';
  end if;
  if p_actor_id not in (v_seller, v_buyer)
     and not exists (select 1 from public."user" where user_id = p_actor_id and role in ('admin', 'manager')) then
    raise exception 'not authorised to cancel this trade' using errcode = '42501';
  end if;

  update public.wallets
     set locked_balance = locked_balance - v_amount,
         balance        = balance + v_amount,
         updated_at     = now()
   where user_id = v_seller;

  if v_listing is not null then
    update public.p2p_listings
       set available_pewgift = available_pewgift + v_amount, updated_at = now()
     where id = v_listing;
  end if;

  insert into public.wallet_ledger (wallet_id, counterpart_id, amount, transaction_type, reference_id, metadata)
  values (v_seller, v_buyer, v_amount, 'ESCROW_DISPUTE_REFUND', p_trade_id,
          jsonb_build_object('reason', p_reason));

  update public.p2p_trades
     set status = 'cancelled', dispute_reason = coalesce(p_reason, dispute_reason), updated_at = now()
   where id = p_trade_id;

  return v_amount;
end;
$$;

create or replace function public.dispute_p2p_trade(p_trade_id uuid, p_actor_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_buyer  uuid;
begin
  select seller_id, buyer_id into v_seller, v_buyer
  from public.p2p_trades where id = p_trade_id for update;

  if v_seller is null then
    raise exception 'trade not found' using errcode = 'P0002';
  end if;
  if p_actor_id not in (v_seller, v_buyer) then
    raise exception 'not a party to this trade' using errcode = '42501';
  end if;

  update public.p2p_trades
     set status = 'disputed', dispute_reason = p_reason, updated_at = now()
   where id = p_trade_id;

  insert into public.security_alerts (kind, actor_id, subject_id, severity, detail)
  values ('P2P_TRADE_DISPUTED', p_actor_id, p_trade_id, 'CRITICAL',
          jsonb_build_object('reason', p_reason));
end;
$$;

-- The legacy escrow action function deducted the seller's spendable balance
-- without recording a lock, so cancelled trades never refunded. Superseded by
-- open/release/cancel/dispute above.
drop function if exists public.execute_p2p_escrow_action(uuid, text);

-- ---------------------------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------------------------

alter table public.supported_assets       enable row level security;
alter table public.seller_profiles        enable row level security;
alter table public.seller_payment_methods enable row level security;
alter table public.p2p_listings           enable row level security;
alter table public.security_alerts        enable row level security;

drop policy if exists supported_assets_read on public.supported_assets;
create policy supported_assets_read on public.supported_assets for select using (is_enabled);

drop policy if exists seller_profiles_read on public.seller_profiles;
create policy seller_profiles_read on public.seller_profiles for select using (true);

-- Payout details are revealed to a buyer only through the trade record.
drop policy if exists seller_payment_methods_owner on public.seller_payment_methods;
create policy seller_payment_methods_owner on public.seller_payment_methods
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists p2p_listings_read on public.p2p_listings;
create policy p2p_listings_read on public.p2p_listings for select using (is_active);

drop policy if exists p2p_listings_owner_write on public.p2p_listings;
create policy p2p_listings_owner_write on public.p2p_listings
  for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Alerts are admin-only; no policy grants read access to end users.

-- ---------------------------------------------------------------------------
-- 10. asset catalogue seed
-- ---------------------------------------------------------------------------
-- Every ISO-4217 currency is catalogued so the admin can enable any of them,
-- but nothing goes live until a reference_rate is set: a seeded asset stays
-- disabled and matching skips disabled assets.

insert into public.supported_assets (code, kind, display_name, decimals, is_enabled)
values
  ('AED', 'FIAT', 'United Arab Emirates Dirham', 2, false),
  ('AFN', 'FIAT', 'Afghan Afghani', 0, false),
  ('ALL', 'FIAT', 'Albanian Lek', 0, false),
  ('AMD', 'FIAT', 'Armenian Dram', 2, false),
  ('ANG', 'FIAT', 'Netherlands Antillean Guilder', 2, false),
  ('AOA', 'FIAT', 'Angolan Kwanza', 2, false),
  ('ARS', 'FIAT', 'Argentine Peso', 2, false),
  ('AUD', 'FIAT', 'Australian Dollar', 2, false),
  ('AWG', 'FIAT', 'Aruban Florin', 2, false),
  ('AZN', 'FIAT', 'Azerbaijani Manat', 2, false),
  ('BAM', 'FIAT', 'Bosnia-Herzegovina Convertible Mark', 2, false),
  ('BBD', 'FIAT', 'Barbadian Dollar', 2, false),
  ('BDT', 'FIAT', 'Bangladeshi Taka', 2, false),
  ('BGN', 'FIAT', 'Bulgarian Lev', 2, false),
  ('BHD', 'FIAT', 'Bahraini Dinar', 3, false),
  ('BIF', 'FIAT', 'Burundian Franc', 0, false),
  ('BMD', 'FIAT', 'Bermudan Dollar', 2, false),
  ('BND', 'FIAT', 'Brunei Dollar', 2, false),
  ('BOB', 'FIAT', 'Bolivian Boliviano', 2, false),
  ('BRL', 'FIAT', 'Brazilian Real', 2, false),
  ('BSD', 'FIAT', 'Bahamian Dollar', 2, false),
  ('BTN', 'FIAT', 'Bhutanese Ngultrum', 2, false),
  ('BWP', 'FIAT', 'Botswanan Pula', 2, false),
  ('BYN', 'FIAT', 'Belarusian Ruble', 2, false),
  ('BZD', 'FIAT', 'Belize Dollar', 2, false),
  ('CAD', 'FIAT', 'Canadian Dollar', 2, false),
  ('CDF', 'FIAT', 'Congolese Franc', 2, false),
  ('CHF', 'FIAT', 'Swiss Franc', 2, false),
  ('CLP', 'FIAT', 'Chilean Peso', 0, false),
  ('CNY', 'FIAT', 'Chinese Yuan', 2, false),
  ('COP', 'FIAT', 'Colombian Peso', 0, false),
  ('CRC', 'FIAT', 'Costa Rican Colón', 2, false),
  ('CUC', 'FIAT', 'Cuban Convertible Peso', 2, false),
  ('CUP', 'FIAT', 'Cuban Peso', 2, false),
  ('CVE', 'FIAT', 'Cape Verdean Escudo', 2, false),
  ('CZK', 'FIAT', 'Czech Koruna', 2, false),
  ('DJF', 'FIAT', 'Djiboutian Franc', 0, false),
  ('DKK', 'FIAT', 'Danish Krone', 2, false),
  ('DOP', 'FIAT', 'Dominican Peso', 2, false),
  ('DZD', 'FIAT', 'Algerian Dinar', 2, false),
  ('EGP', 'FIAT', 'Egyptian Pound', 2, false),
  ('ERN', 'FIAT', 'Eritrean Nakfa', 2, false),
  ('ETB', 'FIAT', 'Ethiopian Birr', 2, false),
  ('EUR', 'FIAT', 'Euro', 2, false),
  ('FJD', 'FIAT', 'Fijian Dollar', 2, false),
  ('FKP', 'FIAT', 'Falkland Islands Pound', 2, false),
  ('GBP', 'FIAT', 'British Pound', 2, false),
  ('GEL', 'FIAT', 'Georgian Lari', 2, false),
  ('GHS', 'FIAT', 'Ghanaian Cedi', 2, false),
  ('GIP', 'FIAT', 'Gibraltar Pound', 2, false),
  ('GMD', 'FIAT', 'Gambian Dalasi', 2, false),
  ('GNF', 'FIAT', 'Guinean Franc', 0, false),
  ('GTQ', 'FIAT', 'Guatemalan Quetzal', 2, false),
  ('GYD', 'FIAT', 'Guyanaese Dollar', 2, false),
  ('HKD', 'FIAT', 'Hong Kong Dollar', 2, false),
  ('HNL', 'FIAT', 'Honduran Lempira', 2, false),
  ('HRK', 'FIAT', 'Croatian Kuna', 2, false),
  ('HTG', 'FIAT', 'Haitian Gourde', 2, false),
  ('HUF', 'FIAT', 'Hungarian Forint', 0, false),
  ('IDR', 'FIAT', 'Indonesian Rupiah', 0, false),
  ('ILS', 'FIAT', 'Israeli New Shekel', 2, false),
  ('INR', 'FIAT', 'Indian Rupee', 2, false),
  ('IQD', 'FIAT', 'Iraqi Dinar', 0, false),
  ('IRR', 'FIAT', 'Iranian Rial', 0, false),
  ('ISK', 'FIAT', 'Icelandic Króna', 0, false),
  ('JMD', 'FIAT', 'Jamaican Dollar', 2, false),
  ('JOD', 'FIAT', 'Jordanian Dinar', 3, false),
  ('JPY', 'FIAT', 'Japanese Yen', 0, false),
  ('KES', 'FIAT', 'Kenyan Shilling', 2, false),
  ('KGS', 'FIAT', 'Kyrgyz Som', 2, false),
  ('KHR', 'FIAT', 'Cambodian Riel', 2, false),
  ('KMF', 'FIAT', 'Comorian Franc', 0, false),
  ('KPW', 'FIAT', 'North Korean Won', 0, false),
  ('KRW', 'FIAT', 'South Korean Won', 0, false),
  ('KWD', 'FIAT', 'Kuwaiti Dinar', 3, false),
  ('KYD', 'FIAT', 'Cayman Islands Dollar', 2, false),
  ('KZT', 'FIAT', 'Kazakhstani Tenge', 2, false),
  ('LAK', 'FIAT', 'Laotian Kip', 0, false),
  ('LBP', 'FIAT', 'Lebanese Pound', 0, false),
  ('LKR', 'FIAT', 'Sri Lankan Rupee', 2, false),
  ('LRD', 'FIAT', 'Liberian Dollar', 2, false),
  ('LSL', 'FIAT', 'Lesotho Loti', 2, false),
  ('LYD', 'FIAT', 'Libyan Dinar', 3, false),
  ('MAD', 'FIAT', 'Moroccan Dirham', 2, false),
  ('MDL', 'FIAT', 'Moldovan Leu', 2, false),
  ('MGA', 'FIAT', 'Malagasy Ariary', 0, false),
  ('MKD', 'FIAT', 'Macedonian Denar', 2, false),
  ('MMK', 'FIAT', 'Myanmar Kyat', 0, false),
  ('MNT', 'FIAT', 'Mongolian Tugrik', 2, false),
  ('MOP', 'FIAT', 'Macanese Pataca', 2, false),
  ('MRU', 'FIAT', 'Mauritanian Ouguiya', 2, false),
  ('MUR', 'FIAT', 'Mauritian Rupee', 2, false),
  ('MVR', 'FIAT', 'Maldivian Rufiyaa', 2, false),
  ('MWK', 'FIAT', 'Malawian Kwacha', 2, false),
  ('MXN', 'FIAT', 'Mexican Peso', 2, false),
  ('MYR', 'FIAT', 'Malaysian Ringgit', 2, false),
  ('MZN', 'FIAT', 'Mozambican Metical', 2, false),
  ('NAD', 'FIAT', 'Namibian Dollar', 2, false),
  ('NGN', 'FIAT', 'Nigerian Naira', 2, false),
  ('NIO', 'FIAT', 'Nicaraguan Córdoba', 2, false),
  ('NOK', 'FIAT', 'Norwegian Krone', 2, false),
  ('NPR', 'FIAT', 'Nepalese Rupee', 2, false),
  ('NZD', 'FIAT', 'New Zealand Dollar', 2, false),
  ('OMR', 'FIAT', 'Omani Rial', 3, false),
  ('PAB', 'FIAT', 'Panamanian Balboa', 2, false),
  ('PEN', 'FIAT', 'Peruvian Sol', 2, false),
  ('PGK', 'FIAT', 'Papua New Guinean Kina', 2, false),
  ('PHP', 'FIAT', 'Philippine Peso', 2, false),
  ('PKR', 'FIAT', 'Pakistani Rupee', 0, false),
  ('PLN', 'FIAT', 'Polish Zloty', 2, false),
  ('PYG', 'FIAT', 'Paraguayan Guarani', 0, false),
  ('QAR', 'FIAT', 'Qatari Riyal', 2, false),
  ('RON', 'FIAT', 'Romanian Leu', 2, false),
  ('RSD', 'FIAT', 'Serbian Dinar', 2, false),
  ('RUB', 'FIAT', 'Russian Ruble', 2, false),
  ('RWF', 'FIAT', 'Rwandan Franc', 0, false),
  ('SAR', 'FIAT', 'Saudi Riyal', 2, false),
  ('SBD', 'FIAT', 'Solomon Islands Dollar', 2, false),
  ('SCR', 'FIAT', 'Seychellois Rupee', 2, false),
  ('SDG', 'FIAT', 'Sudanese Pound', 2, false),
  ('SEK', 'FIAT', 'Swedish Krona', 2, false),
  ('SGD', 'FIAT', 'Singapore Dollar', 2, false),
  ('SHP', 'FIAT', 'St. Helena Pound', 2, false),
  ('SLE', 'FIAT', 'Sierra Leonean Leone', 2, false),
  ('SLL', 'FIAT', 'Sierra Leonean Leone (1964—2022)', 0, false),
  ('SOS', 'FIAT', 'Somali Shilling', 0, false),
  ('SRD', 'FIAT', 'Surinamese Dollar', 2, false),
  ('SSP', 'FIAT', 'South Sudanese Pound', 2, false),
  ('STN', 'FIAT', 'São Tomé & Príncipe Dobra', 2, false),
  ('SVC', 'FIAT', 'Salvadoran Colón', 2, false),
  ('SYP', 'FIAT', 'Syrian Pound', 0, false),
  ('SZL', 'FIAT', 'Swazi Lilangeni', 2, false),
  ('THB', 'FIAT', 'Thai Baht', 2, false),
  ('TJS', 'FIAT', 'Tajikistani Somoni', 2, false),
  ('TMT', 'FIAT', 'Turkmenistani Manat', 2, false),
  ('TND', 'FIAT', 'Tunisian Dinar', 3, false),
  ('TOP', 'FIAT', 'Tongan Paʻanga', 2, false),
  ('TRY', 'FIAT', 'Turkish Lira', 2, false),
  ('TTD', 'FIAT', 'Trinidad & Tobago Dollar', 2, false),
  ('TWD', 'FIAT', 'New Taiwan Dollar', 2, false),
  ('TZS', 'FIAT', 'Tanzanian Shilling', 2, false),
  ('UAH', 'FIAT', 'Ukrainian Hryvnia', 2, false),
  ('UGX', 'FIAT', 'Ugandan Shilling', 0, false),
  ('USD', 'FIAT', 'US Dollar', 2, false),
  ('UYU', 'FIAT', 'Uruguayan Peso', 2, false),
  ('UZS', 'FIAT', 'Uzbekistani Som', 2, false),
  ('VES', 'FIAT', 'Venezuelan Bolívar', 2, false),
  ('VND', 'FIAT', 'Vietnamese Dong', 0, false),
  ('VUV', 'FIAT', 'Vanuatu Vatu', 0, false),
  ('WST', 'FIAT', 'Samoan Tala', 2, false),
  ('XAF', 'FIAT', 'Central African CFA Franc', 0, false),
  ('XCD', 'FIAT', 'East Caribbean Dollar', 2, false),
  ('XCG', 'FIAT', 'Caribbean guilder', 2, false),
  ('XDR', 'FIAT', 'Special Drawing Rights', 2, false),
  ('XOF', 'FIAT', 'West African CFA Franc', 0, false),
  ('XPF', 'FIAT', 'CFP Franc', 0, false),
  ('XSU', 'FIAT', 'Sucre', 2, false),
  ('YER', 'FIAT', 'Yemeni Rial', 0, false),
  ('ZAR', 'FIAT', 'South African Rand', 2, false),
  ('ZMW', 'FIAT', 'Zambian Kwacha', 2, false),
  ('ZWG', 'FIAT', 'Zimbabwean Gold', 2, false),
  ('ZWL', 'FIAT', 'Zimbabwean Dollar (2009–2024)', 2, false)
on conflict (code) do update set
  kind         = excluded.kind,
  display_name = excluded.display_name,
  decimals     = excluded.decimals;

-- USD is the peg, so its rate is exact and it ships enabled.
update public.supported_assets
   set reference_rate = 1, is_enabled = true, sort_order = 1
 where code = 'USD';
