-- Fruk: devices signed in to an account, per-device logout and device restrictions.
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  label text,
  user_agent text,
  ip text,
  location text,
  session_id uuid,
  allowed boolean not null default false,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  signed_out_at timestamptz,
  unique (user_id, device_id)
);
create index if not exists user_devices_user_idx on public.user_devices (user_id, last_seen desc);
alter table public.user_devices enable row level security;

create table if not exists public.user_device_policy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'any' check (mode in ('any', 'listed', 'single')),
  updated_at timestamptz not null default now()
);
alter table public.user_device_policy enable row level security;

-- Ends Supabase auth sessions (their refresh tokens go with them), so the device is signed out.
create or replace function public.revoke_auth_sessions(p_user uuid, p_sessions uuid[])
returns integer language plpgsql security definer set search_path = public, auth as $$
declare n integer;
begin
  delete from auth.sessions where user_id = p_user and id = any(p_sessions);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.revoke_auth_sessions(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.revoke_auth_sessions(uuid, uuid[]) to service_role;

-- Every session of the user except the one making the request.
create or replace function public.revoke_other_auth_sessions(p_user uuid, p_keep uuid)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare n integer;
begin
  delete from auth.sessions where user_id = p_user and (p_keep is null or id <> p_keep);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.revoke_other_auth_sessions(uuid, uuid) from public, anon, authenticated;
grant execute on function public.revoke_other_auth_sessions(uuid, uuid) to service_role;
