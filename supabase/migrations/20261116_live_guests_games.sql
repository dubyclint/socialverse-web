-- LIVE multi-guest (up to 8 viewers on screen) and co-host (up to 4 creators on screen) seats,
-- plus the timed "top gift getter" game.
create table if not exists public.stream_guests (
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('guest', 'cohost')),
  status text not null check (status in ('requested', 'invited', 'active', 'left', 'removed', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (stream_id, user_id)
);
create index if not exists stream_guests_active_idx on public.stream_guests (stream_id) where status = 'active';
alter table public.stream_guests enable row level security;
revoke all on public.stream_guests from anon, authenticated;

create table if not exists public.stream_gift_games (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  created_by uuid not null,
  duration_seconds integer not null check (duration_seconds between 30 and 3600),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'live' check (status in ('live', 'finished', 'cancelled')),
  winner_ids uuid[] not null default '{}',
  results jsonb not null default '[]'::jsonb
);
create unique index if not exists stream_gift_games_one_live on public.stream_gift_games (stream_id) where status = 'live';
alter table public.stream_gift_games enable row level security;
revoke all on public.stream_gift_games from anon, authenticated;
