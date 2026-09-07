-- Group 4: tables for the feature pages linked from feed.vue whose API routes
-- existed but queried relations that were never created. Columns follow what the
-- routes actually select/insert. Additive and rerunnable.

-- ---------------------------------------------------------------------------
-- Interests (profile interests + admin catalogue)
-- ---------------------------------------------------------------------------
create table if not exists public.interests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  category    text not null default 'general',
  icon        text,
  icon_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.user_interests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, interest_id)
);

-- ---------------------------------------------------------------------------
-- Universe (global interest/country message wall)
-- ---------------------------------------------------------------------------
create table if not exists public.universe_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null check (char_length(content) <= 4000),
  country    text,
  interest   text,
  language   text not null default 'en',
  created_at timestamptz not null default now()
);
create index if not exists universe_messages_recent_idx on public.universe_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Pals (mutual connection requests)
-- ---------------------------------------------------------------------------
create table if not exists public.pals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  pal_id     uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id <> pal_id),
  unique (user_id, pal_id)
);

-- ---------------------------------------------------------------------------
-- Translations
-- ---------------------------------------------------------------------------
create table if not exists public.translations (
  id         uuid primary key default gen_random_uuid(),
  language   text not null,
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  unique (language, key)
);

create table if not exists public.translation_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  original_text    text not null,
  translated_text  text not null,
  source_language  text,
  target_language  text not null,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Verified badge requests
-- ---------------------------------------------------------------------------
create table if not exists public.badge_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  reason     text,
  evidence   jsonb not null default '{}'::jsonb,
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Match filter approval requests
-- ---------------------------------------------------------------------------
create table if not exists public.filter_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  filters           jsonb not null default '{}'::jsonb,
  approved_filters  jsonb not null default '[]'::jsonb,
  rejected_filters  jsonb not null default '[]'::jsonb,
  rejection_reason  text not null default '',
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.match_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  host_id     uuid references auth.users(id) on delete set null,
  starts_at   timestamptz,
  ends_at     timestamptz,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Support desk
-- ---------------------------------------------------------------------------
create table if not exists public.support_agents (
  agent_id          uuid primary key references auth.users(id) on delete cascade,
  name              text not null,
  active            boolean not null default true,
  assigned_features text[] not null default '{}',
  seniority         text not null default 'agent',
  created_at        timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  session_id   text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  agent_id     uuid references auth.users(id) on delete set null,
  escalated_to uuid references auth.users(id) on delete set null,
  topic        text,
  messages     jsonb not null default '[]'::jsonb,
  status       text not null default 'open' check (status in ('open','closed','escalated')),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz
);

-- ---------------------------------------------------------------------------
-- Post drafts, shares, views
-- ---------------------------------------------------------------------------
create table if not exists public.post_drafts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null default '',
  privacy       text not null default 'public',
  tags          text[] not null default '{}',
  mentions      text[] not null default '{}',
  media_urls    text[] not null default '{}',
  scheduled_at  timestamptz,
  last_saved_at timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.post_shares (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references public.posts(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  shared_to text,
  shared_at timestamptz not null default now()
);

create table if not exists public.post_views (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  viewer_id   uuid references auth.users(id) on delete set null,
  device_type text,
  country     text,
  viewed_at   timestamptz not null default now()
);
create index if not exists post_views_post_idx on public.post_views (post_id, viewed_at desc);

-- Aggregate read model used by /api/posts/[id]/analytics.
create or replace view public.post_analytics
with (security_invoker = true) as
  select
    p.id as post_id,
    p.user_id,
    (select count(*) from public.post_views v where v.post_id = p.id)    as views,
    (select count(*) from public.post_shares s where s.post_id = p.id)   as shares,
    (select count(*) from public.post_likes l where l.post_id = p.id)    as likes,
    (select count(*) from public.post_comments c where c.post_id = p.id) as comments,
    p.created_at
  from public.posts p;

-- ---------------------------------------------------------------------------
-- Contact sync
-- ---------------------------------------------------------------------------
create table if not exists public.user_contacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  contact_id   uuid references auth.users(id) on delete cascade,
  phone_hash   text,
  display_name text,
  created_at   timestamptz not null default now(),
  unique (user_id, phone_hash)
);

-- ---------------------------------------------------------------------------
-- Settings, policies, overrides, ranks
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  scope      text not null,
  key        text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (scope, key)
);

create table if not exists public.policies (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text unique,
  body       text not null default '',
  version    integer not null default 1,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.terms_and_policies (
  feature    text primary key,
  title      text not null default '',
  content    text not null default '',
  version    integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_overrides (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  override_type text not null,
  key           text not null,
  value         jsonb not null default '{}'::jsonb,
  expires_at    timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (user_id, override_type, key)
);

create table if not exists public.rank_config (
  rank   text primary key,
  points integer not null check (points >= 0)
);

insert into public.rank_config (rank, points) values
  ('BRONZE', 0), ('SILVER', 500), ('GOLD', 2000), ('PLATINUM', 10000), ('DIAMOND', 50000)
on conflict (rank) do nothing;

create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  level       integer not null default 0,
  description text
);

insert into public.roles (name, level, description) values
  ('user', 0, 'Standard member'),
  ('moderator', 1, 'Content moderation'),
  ('manager', 2, 'Operations and P2P settlement'),
  ('admin', 3, 'Full administration')
on conflict (name) do nothing;

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  resource    text not null,
  action      text not null,
  min_role    text not null default 'admin',
  description text,
  unique (resource, action)
);

-- ---------------------------------------------------------------------------
-- Admin audit surfaces
-- ---------------------------------------------------------------------------
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.balance_adjustments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  admin_id   uuid references auth.users(id) on delete set null,
  amount     numeric(20,4) not null,
  action     text not null default 'add',
  reason     text,
  created_at timestamptz not null default now()
);

create table if not exists public.flagged_content (
  id           uuid primary key default gen_random_uuid(),
  content_id   text not null,
  content_type text not null,
  reason       text,
  flagged_by   uuid references auth.users(id) on delete set null,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS. Member-owned rows are self-scoped; catalogues are readable by everyone
-- signed in; admin surfaces are service-role/staff only (no policy = no access
-- for anon/authenticated, which is what these admin routes rely on).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  owner_tables text[] := array['user_interests','pals','badge_requests','filter_requests','post_drafts','post_shares','post_views','user_contacts','user_overrides','chat_sessions'];
  public_read  text[] := array['interests','translations','policies','terms_and_policies','rank_config','roles','permissions','match_events','support_agents','universe_messages'];
  admin_only   text[] := array['admin_actions','balance_adjustments','flagged_content','translation_logs','settings'];
  col text;
begin
  foreach t in array owner_tables || public_read || admin_only loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  foreach t in array owner_tables loop
    select case when t = 'post_views' then 'viewer_id' else 'user_id' end into col;
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (%I = auth.uid()) with check (%I = auth.uid())',
      t || '_owner_all', t, col, col
    );
  end loop;

  foreach t in array public_read loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_read', t);
  end loop;

  -- Universe is a write-your-own wall on top of the shared read policy.
  execute 'drop policy if exists universe_messages_write on public.universe_messages';
  execute 'create policy universe_messages_write on public.universe_messages for insert to authenticated with check (user_id = auth.uid())';
end $$;

-- ---------------------------------------------------------------------------
-- Status stories: the live table lacked the text-story fields the status API
-- writes, and presence had no table at all.
-- ---------------------------------------------------------------------------
alter table public.user_statuses add column if not exists content text;
alter table public.user_statuses add column if not exists background_color text;
alter table public.user_statuses add column if not exists text_color text;
alter table public.user_statuses add column if not exists view_count integer not null default 0;
alter table public.user_statuses add column if not exists deleted_at timestamptz;

create table if not exists public.user_presence (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  status     text not null default 'offline' check (status in ('online','offline','away','busy')),
  last_seen  timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;
drop policy if exists user_presence_read on public.user_presence;
create policy user_presence_read on public.user_presence for select to authenticated using (true);
drop policy if exists user_presence_own on public.user_presence;
create policy user_presence_own on public.user_presence for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.increment_status_views(status_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.user_statuses set view_count = view_count + 1 where id = status_id;
$$;

-- ---------------------------------------------------------------------------
-- Group chats are ordinary chat rooms with is_group_chat = true; keep the
-- legacy names working as views so the group-chat helpers hit real rows.
-- ---------------------------------------------------------------------------
create or replace view public.group_chats
with (security_invoker = true) as
  select id, room_name as name, room_avatar as avatar_url, created_by, created_at, updated_at
  from public.chat_rooms
  where is_group_chat = true;

create or replace view public.group_chat_members
with (security_invoker = true) as
  select id, room_id as group_id, user_id, joined_at
  from public.chat_room_members;
