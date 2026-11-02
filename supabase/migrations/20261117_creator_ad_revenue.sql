-- Sutoi G: per-view ad requests on Veep, engaged-view (>= 6s) + rendered-ad gated creator credits.
create table if not exists public.ad_revenue_events (
  ad_request_id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  creator_id uuid not null,
  viewer_id uuid not null,
  watch_time_seconds double precision not null default 0,
  is_engaged_view boolean not null default false,
  ad_interacted boolean not null default false,
  ad_type_served text not null default 'none' check (ad_type_served in ('interstitial', 'rewarded', 'native_banner', 'house_ad', 'none')),
  network_source text not null default 'internal_house' check (network_source in ('monetag', 'appodeal', 'internal_house')),
  fill_status text not null default 'requested' check (fill_status in ('requested', 'filled', 'rendered_failed', 'no_ad', 'rendered')),
  current_network_ecpm numeric(12,4) not null default 0,
  raw_ad_revenue numeric(20,8) not null default 0,
  wallet_credit_amount numeric(20,8) not null default 0,
  credited boolean not null default false,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index if not exists ad_revenue_events_creator_idx on public.ad_revenue_events (creator_id, created_at desc);
create index if not exists ad_revenue_events_post_idx on public.ad_revenue_events (post_id);
alter table public.ad_revenue_events enable row level security;
revoke all on public.ad_revenue_events from anon, authenticated;

-- Micro-cent creator balance: credits accrue here and move to the wallet in whole cents.
create table if not exists public.creator_ad_balances (
  creator_id uuid primary key,
  pending_amount numeric(20,8) not null default 0,
  lifetime_amount numeric(20,8) not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.creator_ad_balances enable row level security;
revoke all on public.creator_ad_balances from anon, authenticated;

-- Platform fund programme: flat PEW per engaged view (admin-set, default 0), tracked apart from ad share.
alter table public.ad_revenue_events add column if not exists fund_credit_amount numeric(20,8) not null default 0;
