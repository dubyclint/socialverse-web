-- =============================================================================
-- Group 2.3 — live streaming presence, battle matches and gifting scores
-- =============================================================================
-- Scores are derived from server-recorded events only (gift_transactions and
-- battle taps); the client never submits a score. Timers are server
-- authoritative: ends_at is set when the match starts and the winner is
-- resolved from the recorded events, not from the browser clock.
--
-- Additive and idempotent. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. viewer presence (drives streams.current_viewer_count / peak_viewer_count)
-- ---------------------------------------------------------------------------

create table if not exists public.stream_viewers (
  id         uuid primary key default gen_random_uuid(),
  stream_id  uuid        not null references public.streams (id) on delete cascade,
  viewer_id  uuid        not null references auth.users (id) on delete cascade,
  is_active  boolean     not null default true,
  joined_at  timestamptz not null default now(),
  left_at    timestamptz,
  unique (stream_id, viewer_id)
);

create index if not exists stream_viewers_active_idx on public.stream_viewers (stream_id) where is_active;

create or replace function public.sync_stream_viewer_counts(p_stream_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  select count(*) into v_count
  from public.stream_viewers where stream_id = p_stream_id and is_active;

  update public.streams
     set current_viewer_count = v_count,
         peak_viewer_count    = greatest(peak_viewer_count, v_count),
         updated_at           = now()
   where id = p_stream_id;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. per-user broadcast settings (stream settings screen)
-- ---------------------------------------------------------------------------

create table if not exists public.stream_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  settings   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. battle matches
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.stream_match_mode as enum ('SOLO', 'TEAM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.stream_match_state as enum ('PENDING', 'LIVE', 'FINISHED', 'CANCELLED');
exception when duplicate_object then null; end $$;

create table if not exists public.stream_matches (
  id             uuid primary key default gen_random_uuid(),
  mode           public.stream_match_mode  not null default 'SOLO',
  status         public.stream_match_state not null default 'PENDING',
  duration_seconds integer   not null default 300 check (duration_seconds between 30 and 3600),
  started_at     timestamptz,
  ends_at        timestamptz,
  winning_side   smallint,
  created_by     uuid        not null references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists stream_matches_live_idx on public.stream_matches (status, ends_at);

create table if not exists public.stream_match_participants (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid     not null references public.stream_matches (id) on delete cascade,
  stream_id  uuid     not null references public.streams (id) on delete cascade,
  user_id    uuid     not null references auth.users (id) on delete cascade,
  side       smallint not null check (side in (1, 2)),
  score      numeric(20,4) not null default 0,
  joined_at  timestamptz not null default now(),
  unique (match_id, user_id)
);

do $$ begin
  create type public.stream_match_event_kind as enum ('GIFT', 'TAP');
exception when duplicate_object then null; end $$;

create table if not exists public.stream_match_events (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid     not null references public.stream_matches (id) on delete cascade,
  side       smallint not null check (side in (1, 2)),
  actor_id   uuid     not null references auth.users (id) on delete cascade,
  kind       public.stream_match_event_kind not null,
  points     numeric(20,4) not null check (points > 0),
  gift_id    uuid references public.gift_catalog (id),
  created_at timestamptz not null default now()
);

create index if not exists stream_match_events_match_idx on public.stream_match_events (match_id, created_at);

-- ---------------------------------------------------------------------------
-- 4. server-authoritative scoring
-- ---------------------------------------------------------------------------

-- Records a contribution and rolls it into the side's score. Taps are capped by
-- the caller; gifts are priced from gift_catalog by send_pewgift().
create or replace function public.record_match_event(
  p_match_id uuid,
  p_actor_id uuid,
  p_side     smallint,
  p_kind     public.stream_match_event_kind,
  p_points   numeric,
  p_gift_id  uuid default null
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.stream_match_state;
  v_ends_at timestamptz;
  v_side_score numeric;
begin
  select status, ends_at into v_status, v_ends_at
  from public.stream_matches where id = p_match_id for update;

  if v_status is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_status <> 'LIVE' or (v_ends_at is not null and now() >= v_ends_at) then
    raise exception 'match is not accepting contributions' using errcode = '22023';
  end if;

  if not exists (select 1 from public.stream_match_participants
                 where match_id = p_match_id and side = p_side) then
    raise exception 'side is not part of this match' using errcode = '22023';
  end if;

  -- Taps are free engagement, so they are worth one point and throttled here
  -- rather than trusted from the client.
  if p_kind = 'TAP' then
    if p_points <> 1 then
      raise exception 'a tap is worth one point' using errcode = '22023';
    end if;
    if (select count(*) from public.stream_match_events
         where match_id = p_match_id and actor_id = p_actor_id and kind = 'TAP'
           and created_at > now() - interval '10 seconds') >= 20 then
      raise exception 'tap rate limit exceeded' using errcode = '53400';
    end if;
  end if;

  insert into public.stream_match_events (match_id, side, actor_id, kind, points, gift_id)
  values (p_match_id, p_side, p_actor_id, p_kind, p_points, p_gift_id);

  update public.stream_match_participants
     set score = score + p_points
   where match_id = p_match_id and side = p_side;

  select coalesce(sum(points), 0) into v_side_score
  from public.stream_match_events where match_id = p_match_id and side = p_side;

  return v_side_score;
end;
$$;

-- Starts a match; ends_at is derived from the server clock so every client
-- counts down against the same authoritative deadline.
create or replace function public.start_stream_match(p_match_id uuid, p_actor_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.stream_match_state;
  v_creator uuid;
  v_duration integer;
  v_ends_at timestamptz;
  v_sides integer;
begin
  select status, created_by, duration_seconds, ends_at
    into v_status, v_creator, v_duration, v_ends_at
  from public.stream_matches where id = p_match_id for update;

  if v_status is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_status = 'LIVE' then
    return v_ends_at;
  end if;
  if v_status <> 'PENDING' then
    raise exception 'match cannot be started' using errcode = '22023';
  end if;
  if p_actor_id <> v_creator
     and not exists (select 1 from public."user" where user_id = p_actor_id and role in ('admin', 'manager')) then
    raise exception 'not authorised to start this match' using errcode = '42501';
  end if;

  select count(distinct side) into v_sides
  from public.stream_match_participants where match_id = p_match_id;

  if v_sides < 2 then
    raise exception 'both sides must have a co-host' using errcode = '22023';
  end if;

  update public.stream_matches
     set status = 'LIVE', started_at = now(), ends_at = now() + make_interval(secs => v_duration), updated_at = now()
   where id = p_match_id
  returning ends_at into v_ends_at;

  return v_ends_at;
end;
$$;

-- Closes an expired match and freezes the winning side.
create or replace function public.finalize_stream_match(p_match_id uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ends_at timestamptz;
  v_status  public.stream_match_state;
  v_one numeric;
  v_two numeric;
  v_winner smallint;
begin
  select status, ends_at into v_status, v_ends_at
  from public.stream_matches where id = p_match_id for update;

  if v_status is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if v_status = 'FINISHED' then
    select winning_side into v_winner from public.stream_matches where id = p_match_id;
    return v_winner;
  end if;
  if v_ends_at is null or now() < v_ends_at then
    raise exception 'match has not ended yet' using errcode = '22023';
  end if;

  select coalesce(sum(points) filter (where side = 1), 0),
         coalesce(sum(points) filter (where side = 2), 0)
    into v_one, v_two
  from public.stream_match_events where match_id = p_match_id;

  v_winner := case when v_one > v_two then 1 when v_two > v_one then 2 else null end;

  update public.stream_matches
     set status = 'FINISHED', winning_side = v_winner, updated_at = now()
   where id = p_match_id;

  return v_winner;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------

alter table public.stream_viewers            enable row level security;
alter table public.stream_settings           enable row level security;
alter table public.stream_matches            enable row level security;
alter table public.stream_match_participants enable row level security;
alter table public.stream_match_events       enable row level security;

drop policy if exists stream_viewers_read on public.stream_viewers;
create policy stream_viewers_read on public.stream_viewers for select using (true);

drop policy if exists stream_viewers_self_write on public.stream_viewers;
create policy stream_viewers_self_write on public.stream_viewers
  for all using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);

drop policy if exists stream_settings_owner on public.stream_settings;
create policy stream_settings_owner on public.stream_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists stream_matches_read on public.stream_matches;
create policy stream_matches_read on public.stream_matches for select using (true);

drop policy if exists stream_match_participants_read on public.stream_match_participants;
create policy stream_match_participants_read on public.stream_match_participants for select using (true);

drop policy if exists stream_match_events_read on public.stream_match_events;
create policy stream_match_events_read on public.stream_match_events for select using (true);
