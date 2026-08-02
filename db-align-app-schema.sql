-- Additive alignment between the application code and the live Supabase schema.
--
--   1. `manager` role — the RBAC composable, /admin/managers and the admin panel
--      all assign it, but the user_role enum only had user/moderator/admin.
--   2. streaming defaults stored per user (profile settings screen).
--   3. wallet feature tables the wallet page reads and writes.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. roles
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'manager'
  ) then
    alter type public.user_role add value 'manager';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. streaming preferences
-- ---------------------------------------------------------------------------

alter table public."user" add column if not exists default_stream_title text;
alter table public."user" add column if not exists stream_quality       text;

-- ---------------------------------------------------------------------------
-- 3. wallet feature tables
-- ---------------------------------------------------------------------------

create table if not exists public.payment_methods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  provider     text not null,
  label        text,
  last4        text,
  is_default   boolean not null default false,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payment_methods_user_id_idx on public.payment_methods (user_id);

create table if not exists public.withdrawals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  amount         numeric(18, 2) not null check (amount > 0),
  currency       text not null default 'USD',
  status         text not null default 'pending',
  destination    text,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  processed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists withdrawals_user_id_idx on public.withdrawals (user_id);

create table if not exists public.referrals (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  referral_code     text unique not null,
  referred_by       uuid references auth.users (id) on delete set null,
  total_referrals   integer not null default 0,
  referral_earnings numeric(18, 2) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.payment_methods enable row level security;
alter table public.withdrawals     enable row level security;
alter table public.referrals       enable row level security;

drop policy if exists payment_methods_own on public.payment_methods;
create policy payment_methods_own on public.payment_methods
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists withdrawals_own on public.withdrawals;
create policy withdrawals_own on public.withdrawals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists referrals_own on public.referrals;
create policy referrals_own on public.referrals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
