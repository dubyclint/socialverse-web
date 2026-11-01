-- Live rooms: like counter and per-stream chat mutes set by the host.
alter table public.streams add column if not exists like_count bigint not null default 0;
create table if not exists public.stream_mutes (
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null,
  muted_by uuid not null,
  created_at timestamptz not null default now(),
  primary key (stream_id, user_id)
);
alter table public.stream_mutes enable row level security;
revoke all on public.stream_mutes from anon, authenticated;
