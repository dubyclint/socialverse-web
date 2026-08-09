-- =============================================================================
-- Group 2.1 — Pewgift closed-loop money core
-- =============================================================================
-- 1 Pewgift = $1.00 USD. Balances are non-transferable internal credits; the
-- platform never custodies crypto or foreign fiat. External value is converted
-- at settlement time (deposits.rate_used) net of platform fees.
--
-- Reuses the live schema wherever it already fits:
--   wallets       — balance per (user_id, currency); PEW is the credit ledger.
--   wallet_ledger — append-only double-entry rows (wallet_id = wallets.user_id).
--   gift_catalog  — the Pewgift tier matrix.
--   gift_transactions — one row per gift sent.
--
-- Additive and idempotent. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. wallet lock state (premium "freeze my balance" feature + escrow holds)
-- ---------------------------------------------------------------------------

alter table public.wallets add column if not exists locked_balance numeric(20,4) not null default 0;
alter table public.wallets add column if not exists is_locked      boolean       not null default false;

-- `chk_wallet_positive_balance` already guards `balance`.
alter table public.wallets drop constraint if exists wallets_locked_balance_non_negative;
alter table public.wallets add  constraint wallets_locked_balance_non_negative
  check (locked_balance >= 0);

-- Closed-loop: a user holds exactly one credit balance, denominated in PEW
-- (1 PEW = $1.00 USD). Existing rows are relabelled rather than converted —
-- balances were already USD-pegged credits.
update public.wallets set currency = 'PEW' where currency is distinct from 'PEW';
alter table public.wallets alter column currency set default 'PEW';

-- `wallets` is keyed by user_id alone, so a user holds exactly one credit row.

-- ---------------------------------------------------------------------------
-- 2. deposit settlement
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.deposit_route as enum ('CARD', 'PSP', 'BANK_TRANSFER', 'CRYPTO', 'P2P', 'SUPPORT_AGENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deposit_state as enum ('PENDING', 'AWAITING_PAYMENT', 'SETTLED', 'FAILED', 'REFUNDED');
exception when duplicate_object then null; end $$;

create table if not exists public.payment_providers (
  id             uuid primary key default gen_random_uuid(),
  code           text        not null unique,          -- stripe | doola | alipay | paystack | paypal ...
  display_name   text        not null,
  route          public.deposit_route not null,
  is_enabled     boolean     not null default false,
  supported_currencies text[] not null default '{}',
  config         jsonb       not null default '{}'::jsonb,   -- non-secret config only
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.deposits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  route             public.deposit_route not null,
  provider_code     text        references public.payment_providers (code),
  external_ref      text,
  source_amount     numeric(24,8) not null check (source_amount > 0),
  source_currency   text        not null,
  rate_used         numeric(24,8) not null,            -- source currency -> USD at settlement
  gross_pewgift     numeric(20,4) not null default 0,
  fee_pewgift       numeric(20,4) not null default 0,
  platform_rate_pct numeric(6,4)  not null default 0,
  credited_pewgift  numeric(20,4) not null default 0,
  status            public.deposit_state not null default 'PENDING',
  idempotency_key   text        not null unique,
  metadata          jsonb       not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  settled_at        timestamptz
);

create index if not exists deposits_user_idx   on public.deposits (user_id, created_at desc);
create index if not exists deposits_status_idx on public.deposits (status);

-- PSP webhooks retry: every side effect keyed here runs at most once.
create table if not exists public.idempotency_keys (
  key         text primary key,
  scope       text        not null,
  response    jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. fees, rates and country tiers
-- ---------------------------------------------------------------------------

create table if not exists public.fee_settings (
  id             uuid primary key default gen_random_uuid(),
  scope          text        not null,                 -- deposit | withdrawal | p2p | gift
  route          public.deposit_route,
  country_code   text,
  percent_rate   numeric(6,4) not null default 0,
  flat_fee       numeric(20,4) not null default 0,
  min_amount     numeric(20,4) not null default 0,
  max_amount     numeric(20,4),
  is_active      boolean     not null default true,
  updated_at     timestamptz not null default now(),
  unique (scope, route, country_code)
);

create table if not exists public.country_tiers (
  country_code text primary key,
  tier         smallint    not null check (tier between 1 and 3),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Pewgift tier matrix (product spec §4)
-- ---------------------------------------------------------------------------

insert into public.gift_catalog (name, cost_credits, tier, is_active)
values
  ('Snowfall',          0.067,   'BRONZE',   true),
  ('I Love You',        0.090,   'BRONZE',   true),
  ('Flowers Confetti',  1.500,   'BRONZE',   true),
  ('Food',              5.000,   'SILVER',   true),
  ('Cinema',           12.000,   'SILVER',   true),
  ('Heavenly Shower',  20.000,   'SILVER',   true),
  ('Money Raining',    50.000,   'GOLD',     true),
  ('Diamond Necklace',100.000,   'GOLD',     true),
  ('Tesla Car',       510.000,   'PLATINUM', true),
  ('Ocean',          1500.000,   'PLATINUM', true),
  ('Planet Mars',    5000.000,   'DIAMOND',  true)
on conflict (name) do update
  set cost_credits = excluded.cost_credits,
      tier         = excluded.tier,
      is_active    = excluded.is_active;

-- ---------------------------------------------------------------------------
-- 5. money movement — server-side, row-locked, double-entry
-- ---------------------------------------------------------------------------

create or replace function public.ensure_wallet(p_user_id uuid, p_currency text default 'PEW')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id, currency, balance)
  values (p_user_id, p_currency, 0)
  on conflict (user_id) do nothing;
end;
$$;

-- Debits sender, credits recipient, writes both ledger legs. Pessimistic:
-- wallets rows are locked in a deterministic order to avoid deadlocks.
create or replace function public.transfer_pewgift(
  p_sender_id     uuid,
  p_recipient_id  uuid,
  p_amount        numeric,
  p_debit_type    public.wallet_transaction_ledger_type,
  p_credit_type   public.wallet_transaction_ledger_type,
  p_reference_id  uuid default null,
  p_metadata      jsonb default '{}'::jsonb
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first  uuid;
  v_second uuid;
  v_sender_balance numeric;
  v_locked boolean;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'transfer amount must be positive' using errcode = '22023';
  end if;
  if p_sender_id = p_recipient_id then
    raise exception 'cannot transfer to self' using errcode = '22023';
  end if;

  perform public.ensure_wallet(p_sender_id);
  perform public.ensure_wallet(p_recipient_id);

  v_first  := least(p_sender_id, p_recipient_id);
  v_second := greatest(p_sender_id, p_recipient_id);

  perform 1 from public.wallets where user_id = v_first  and currency = 'PEW' for update;
  perform 1 from public.wallets where user_id = v_second and currency = 'PEW' for update;

  select balance, is_locked into v_sender_balance, v_locked
  from public.wallets where user_id = p_sender_id and currency = 'PEW';

  if v_locked then
    raise exception 'sender balance is locked' using errcode = '55006';
  end if;
  if v_sender_balance < p_amount then
    raise exception 'insufficient balance' using errcode = '23514';
  end if;

  update public.wallets
     set balance = balance - p_amount, updated_at = now()
   where user_id = p_sender_id and currency = 'PEW';

  update public.wallets
     set balance = balance + p_amount, updated_at = now()
   where user_id = p_recipient_id and currency = 'PEW';

  insert into public.wallet_ledger (wallet_id, amount, transaction_type, counterpart_id, reference_id, metadata)
  values
    (p_sender_id,    -p_amount, p_debit_type,  p_recipient_id, p_reference_id, p_metadata),
    (p_recipient_id,  p_amount, p_credit_type, p_sender_id,    p_reference_id, p_metadata);

  select balance into v_sender_balance
  from public.wallets where user_id = p_sender_id and currency = 'PEW';

  return v_sender_balance;
end;
$$;

-- Sends a catalogue gift: prices it server-side, moves the credits and records
-- the gift. Clients never supply the price.
create or replace function public.send_pewgift(
  p_sender_id    uuid,
  p_recipient_id uuid,
  p_gift_id      uuid,
  p_quantity     integer default 1,
  p_stream_id    uuid default null,
  p_context      jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost   numeric;
  v_active boolean;
  v_total  numeric;
  v_new_balance numeric;
  v_gift_tx uuid;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 100 then
    raise exception 'quantity must be between 1 and 100' using errcode = '22023';
  end if;

  select cost_credits, is_active into v_cost, v_active
  from public.gift_catalog where id = p_gift_id;

  if v_cost is null then
    raise exception 'gift not found' using errcode = 'P0002';
  end if;
  if not v_active then
    raise exception 'gift is not available' using errcode = '22023';
  end if;

  v_total := v_cost * p_quantity;

  v_new_balance := public.transfer_pewgift(
    p_sender_id, p_recipient_id, v_total,
    'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM',
    p_gift_id, p_context
  );

  insert into public.gift_transactions (gift_id, sender_id, recipient_id, credit_value, stream_id)
  values (p_gift_id, p_sender_id, p_recipient_id, v_total, p_stream_id)
  returning id into v_gift_tx;

  return jsonb_build_object(
    'transaction_id', v_gift_tx,
    'total_cost', v_total,
    'new_sender_balance', v_new_balance
  );
end;
$$;

-- Settles an external deposit into internal credits, exactly once.
create or replace function public.settle_deposit(p_deposit_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_amount numeric;
  v_status public.deposit_state;
begin
  select user_id, credited_pewgift, status into v_user, v_amount, v_status
  from public.deposits where id = p_deposit_id for update;

  if v_user is null then
    raise exception 'deposit not found' using errcode = 'P0002';
  end if;
  if v_status = 'SETTLED' then
    return v_amount;
  end if;
  if v_amount <= 0 then
    raise exception 'nothing to credit' using errcode = '22023';
  end if;

  perform public.ensure_wallet(v_user);
  perform 1 from public.wallets where user_id = v_user and currency = 'PEW' for update;

  update public.wallets
     set balance = balance + v_amount, updated_at = now()
   where user_id = v_user and currency = 'PEW';

  insert into public.wallet_ledger (wallet_id, amount, transaction_type, reference_id, metadata)
  values (v_user, v_amount, 'DEPOSIT', p_deposit_id, jsonb_build_object('deposit_id', p_deposit_id));

  update public.deposits
     set status = 'SETTLED', settled_at = now()
   where id = p_deposit_id;

  return v_amount;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. RLS — owners read their own money rows; writes go through the functions
-- ---------------------------------------------------------------------------

alter table public.deposits          enable row level security;
alter table public.fee_settings      enable row level security;
alter table public.country_tiers     enable row level security;
alter table public.payment_providers enable row level security;
alter table public.idempotency_keys  enable row level security;

drop policy if exists deposits_owner_read on public.deposits;
create policy deposits_owner_read on public.deposits
  for select using (auth.uid() = user_id);

drop policy if exists fee_settings_read on public.fee_settings;
create policy fee_settings_read on public.fee_settings
  for select using (true);

drop policy if exists country_tiers_read on public.country_tiers;
create policy country_tiers_read on public.country_tiers
  for select using (true);

drop policy if exists payment_providers_read on public.payment_providers;
create policy payment_providers_read on public.payment_providers
  for select using (is_enabled);
