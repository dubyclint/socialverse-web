-- Admin/manager control system: manager permissions, timed bans and feature
-- restrictions, typed verification badges, global announcements.

alter table public."user"
  add column if not exists manager_permissions text[] not null default '{}',
  add column if not exists banned_until timestamptz,
  add column if not exists restrictions jsonb not null default '{}'::jsonb,
  add column if not exists verified_type text;

alter table public."user" drop constraint if exists user_verified_type_check;
alter table public."user" add constraint user_verified_type_check
  check (verified_type is null or verified_type in ('personal','business','government'));

alter table public.pages add column if not exists verified_type text;
alter table public.pages drop constraint if exists pages_verified_type_check;
alter table public.pages add constraint pages_verified_type_check
  check (verified_type is null or verified_type in ('personal','business','government'));

update public."user" set verified_type = 'personal' where is_verified and verified_type is null;
update public.pages set verified_type = 'business' where is_verified and verified_type is null;

create index if not exists badge_requests_status_idx on public.badge_requests (status, created_at desc);
create index if not exists badge_requests_page_idx on public.badge_requests (page_id) where page_id is not null;

create or replace function public.has_staff_permission(p_user uuid, p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public."user"
     where user_id = p_user
       and (role = 'admin' or (role = 'manager' and p_permission = any(manager_permissions)))
  )
$$;

create table if not exists public.announcements (
  id bigserial primary key,
  title text not null check (char_length(title) between 1 and 100),
  message text not null check (char_length(message) between 1 and 1000),
  level text not null default 'info' check (level in ('info','warning','critical')),
  link_url text,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_by_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_active_idx on public.announcements (active, starts_at desc);
alter table public.announcements enable row level security;
drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read on public.announcements
  for select using (active and starts_at <= now() and (ends_at is null or ends_at > now()));
