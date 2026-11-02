-- Sutoi G: creator earnings are reviewed and released by admin per payout period (admin-set days).
create table if not exists public.creator_payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  external_amount numeric(20,8) not null default 0,
  internal_amount numeric(20,8) not null default 0,
  fund_amount numeric(20,8) not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  events_count integer not null default 0,
  adjustment numeric(20,8) not null default 0,
  note text,
  status text not null default 'pending' check (status in ('pending', 'released')),
  released_amount numeric(20,8),
  released_by uuid,
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists creator_payouts_status_idx on public.creator_payouts (status, created_at desc);
create index if not exists creator_payouts_creator_idx on public.creator_payouts (creator_id, created_at desc);
alter table public.creator_payouts enable row level security;
revoke all on public.creator_payouts from anon, authenticated;
alter table public.ad_revenue_events add column if not exists payout_id uuid references public.creator_payouts(id) on delete set null;
create index if not exists ad_revenue_events_unpaid_idx on public.ad_revenue_events (creator_id) where credited and payout_id is null;
