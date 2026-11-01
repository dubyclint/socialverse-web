-- Veep: watch telemetry (view tiers) and per-user library (watched/liked/saved/shared).
create table if not exists public.veep_events (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_ms int not null default 0,
  completed boolean not null default false,
  loops int not null default 0,
  tier text not null check (tier in ('skip', 'standard', 'engaged', 'high')),
  created_at timestamptz not null default now()
);
create index if not exists veep_events_post_idx on public.veep_events (post_id, tier);
create index if not exists veep_events_author_time_idx on public.veep_events (created_at);
alter table public.veep_events enable row level security;
revoke all on public.veep_events from anon, authenticated;

create table if not exists public.veep_library (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  kind text not null check (kind in ('watched', 'liked', 'saved', 'shared')),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id, kind)
);
create index if not exists veep_library_user_idx on public.veep_library (user_id, kind, created_at desc);
alter table public.veep_library enable row level security;
drop policy if exists veep_library_self on public.veep_library;
create policy veep_library_self on public.veep_library for select using (auth.uid() = user_id);
revoke insert, update, delete on public.veep_library from anon, authenticated;

alter table public.posts add column if not exists views_count int not null default 0;
alter table public.posts add column if not exists engaged_views_count int not null default 0;

create or replace function public.veep_count_view(p_post uuid, p_engaged boolean)
returns void language sql security definer set search_path = public as $$
  update posts set views_count = views_count + 1,
                   engaged_views_count = engaged_views_count + case when p_engaged then 1 else 0 end
   where id = p_post
$$;
revoke all on function public.veep_count_view(uuid, boolean) from public, anon, authenticated;
