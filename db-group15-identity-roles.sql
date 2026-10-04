-- =============================================================================
-- Group 15 — identity linking, phone ownership, role management, hardening
-- =============================================================================
-- public."user" is the profile table (one row per auth.users id, user_id is the
-- immutable UUID key). public.profiles is a read view over it.
--
--  * usernames: unique, lowercased, ^[a-z0-9_.]{3,30}$; display_name defaults
--    to the username. Changes go through change_username(): 6 per 30 days, the
--    old handle stays reserved for its owner for 90 days, history is kept.
--  * phone: unique E.164. A number typed at signup or in profile edit is stored
--    unverified when free. A number held by another account is parked in
--    phone_verifications and only moves after ownership is proven through the
--    Telegram bot (the bot asks the user to share their own contact; Telegram
--    vouches for that number). Proven ownership releases the number from the
--    previous holder. Changes are rate limited (1 per 7 days), revertible for
--    24 hours, and recorded in phone_history.
--  * roles: update_user_role() lets admins promote/demote; the master admin is
--    pinned in public.settings and cannot be demoted.
--  * hardening: clients may no longer write role/phone/verification/rank
--    columns directly, nor read other users' email/phone; the profiles view
--    triggers only touch the caller's own row.
-- Re-runnable.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Columns and private tables
-- -----------------------------------------------------------------------------
alter table public."user"
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists username_changed_at timestamptz;

create table if not exists public.phone_verifications (
  user_id uuid primary key references public."user"(user_id) on delete cascade,
  phone text not null,
  phone_country text,
  token text unique,
  token_expires_at timestamptz,
  chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists phone_verifications_chat_idx on public.phone_verifications (chat_id);
alter table public.phone_verifications enable row level security;
revoke all on public.phone_verifications from anon, authenticated;

create table if not exists public.user_telegram_links (
  user_id uuid primary key references public."user"(user_id) on delete cascade,
  chat_id text not null,
  telegram_user_id text,
  linked_at timestamptz not null default now()
);
alter table public.user_telegram_links enable row level security;
revoke all on public.user_telegram_links from anon, authenticated;

create table if not exists public.username_history (
  id bigserial primary key,
  user_id uuid not null references public."user"(user_id) on delete cascade,
  old_username text not null,
  new_username text not null,
  changed_at timestamptz not null default now(),
  reserved_until timestamptz not null default now() + interval '90 days'
);
create index if not exists username_history_old_idx on public.username_history (lower(old_username));
create index if not exists username_history_user_idx on public.username_history (user_id, changed_at desc);
alter table public.username_history enable row level security;
revoke all on public.username_history from anon, authenticated;
grant select on public.username_history to authenticated;
drop policy if exists username_history_own on public.username_history;
create policy username_history_own on public.username_history
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.phone_history (
  id bigserial primary key,
  user_id uuid not null references public."user"(user_id) on delete cascade,
  old_phone text,
  new_phone text,
  reason text not null check (reason in ('signup','backfill','update','verified','released','revert')),
  changed_at timestamptz not null default now(),
  revert_until timestamptz,
  reverted_at timestamptz
);
create index if not exists phone_history_user_idx on public.phone_history (user_id, changed_at desc);
alter table public.phone_history enable row level security;
revoke all on public.phone_history from anon, authenticated;
grant select on public.phone_history to authenticated;
drop policy if exists phone_history_own on public.phone_history;
create policy phone_history_own on public.phone_history
  for select to authenticated using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. Username helpers
-- -----------------------------------------------------------------------------
create or replace function public.slugify_username(p text)
returns text
language sql
immutable
as $$
  select nullif(left(regexp_replace(regexp_replace(lower(btrim(coalesce(p, ''))), '\s+', '_', 'g'),
                                    '[^a-z0-9_.]', '', 'g'), 30), '')
$$;

create or replace function public.username_is_free(p_username text, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public."user" where lower(username) = lower(p_username) and user_id <> p_user)
     and not exists (select 1 from public.username_history
                      where lower(old_username) = lower(p_username) and user_id <> p_user and reserved_until > now())
$$;

create or replace function public.unique_username(p_base text, p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_base text := coalesce(public.slugify_username(p_base), 'user');
  v_try text;
  n int := 1;
begin
  if length(v_base) < 3 then
    v_base := v_base || repeat('_', 3 - length(v_base));
  end if;
  v_try := v_base;
  while not public.username_is_free(v_try, p_user) loop
    n := n + 1;
    v_try := left(v_base, 30 - length(n::text) - 1) || '_' || n;
  end loop;
  return v_try;
end $$;

revoke all on function public.username_is_free(text, uuid) from public, anon;
revoke all on function public.unique_username(text, uuid) from public, anon;
grant execute on function public.username_is_free(text, uuid) to authenticated, service_role;
grant execute on function public.unique_username(text, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 3. Repair existing rows
-- -----------------------------------------------------------------------------
-- 3a. auth users that never got a profile row
insert into public."user" (user_id, username, display_name, email, created_at, updated_at)
select a.id,
       public.unique_username(coalesce(a.raw_user_meta_data->>'username', split_part(a.email, '@', 1)), a.id),
       null, a.email, coalesce(a.created_at, now()), now()
  from auth.users a
  left join public."user" u on u.user_id = a.id
 where u.user_id is null
on conflict (user_id) do nothing;

-- 3b. placeholder or malformed usernames: restore the handle typed at signup
do $$
declare
  r record;
  v_new text;
begin
  for r in
    select u.user_id, u.username, u.display_name, u.email, a.raw_user_meta_data as meta
      from public."user" u
      left join auth.users a on a.id = u.user_id
     where u.username !~ '^[a-z0-9_.]{3,30}$'
        or u.username ~ '^u_[0-9a-f]{8,32}$'
        or u.username ~ '^user_[0-9a-f]{8}$'
     order by u.created_at
  loop
    -- move the placeholder out of the way so the restored handle can be checked
    update public."user" set username = 'tmp_' || replace(r.user_id::text, '-', '') where user_id = r.user_id;
    v_new := public.unique_username(
      coalesce(
        public.slugify_username(r.meta->>'username'),
        case when r.username !~ '^(u_[0-9a-f]{8,32}|user_[0-9a-f]{8}|username_here)$'
             then public.slugify_username(r.username) end,
        public.slugify_username(nullif(r.display_name, 'DISPLAY_NAME_HERE')),
        public.slugify_username(split_part(r.email, '@', 1))
      ),
      r.user_id);
    update public."user" set username = v_new, updated_at = now() where user_id = r.user_id;
  end loop;
end $$;

-- 3c. display_name defaults to the username
update public."user"
   set display_name = username, updated_at = now()
 where display_name is null
    or btrim(display_name) = ''
    or display_name in ('User', 'User Profile', 'DISPLAY_NAME_HERE')
    or display_name ~ '^u_[0-9a-f]{8,32}$';

-- 3d. phones
update public."user" set phone = null where phone is not null and btrim(phone) = '';

-- One holder per number: the master admin, then the earliest account, keeps it;
-- the others keep it as a pending claim they can prove through verification.
with ranked as (
  select user_id, phone, phone_country,
         row_number() over (
           partition by phone
           order by (user_id = '169e9fe8-daae-4542-94df-8d8d1ed4a5e8'::uuid) desc, phone_verified desc, created_at
         ) as rn
    from public."user"
   where phone is not null
), losers as (
  select * from ranked where rn > 1
), parked as (
  insert into public.phone_verifications (user_id, phone, phone_country)
  select user_id, phone, phone_country from losers
  on conflict (user_id) do update set phone = excluded.phone, updated_at = now()
  returning user_id
), hist as (
  insert into public.phone_history (user_id, old_phone, new_phone, reason)
  select user_id, phone, null, 'released' from losers
)
update public."user" u set phone = null, phone_verified = false, updated_at = now()
  from losers l where u.user_id = l.user_id;

create unique index if not exists user_phone_unique on public."user" (phone) where phone is not null;

-- Numbers captured in auth metadata at signup but never copied to the profile.
do $$
declare
  r record;
  v_phone text;
begin
  for r in
    select u.user_id, u.phone_country, a.raw_user_meta_data as meta
      from public."user" u
      join auth.users a on a.id = u.user_id
     where u.phone is null
       and coalesce(a.raw_user_meta_data->>'phone', '') <> ''
     order by u.created_at
  loop
    v_phone := public.normalise_e164(r.meta->>'phone',
                                     coalesce(r.phone_country, nullif(upper(r.meta->>'phone_country'), '')));
    continue when v_phone is null;
    if exists (select 1 from public."user" where phone = v_phone) then
      insert into public.phone_verifications (user_id, phone, phone_country)
      values (r.user_id, v_phone, r.phone_country)
      on conflict (user_id) do nothing;
    else
      update public."user" set phone = v_phone, updated_at = now() where user_id = r.user_id;
      insert into public.phone_history (user_id, old_phone, new_phone, reason)
      values (r.user_id, null, v_phone, 'backfill');
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Signup trigger: username, display name and phone land on the UUID row
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_country text := nullif(upper(btrim(coalesce(v_meta->>'phone_country', ''))), '');
  v_phone text := public.normalise_e164(v_meta->>'phone', v_country);
  v_taken boolean;
  v_username text;
begin
  v_username := public.unique_username(
    coalesce(v_meta->>'username', v_meta->'options'->'data'->>'username', split_part(new.email, '@', 1)),
    new.id);
  v_taken := v_phone is not null and exists (select 1 from public."user" where phone = v_phone);

  insert into public."user" (user_id, username, display_name, email, phone, phone_country, location, created_at, updated_at)
  values (
    new.id, v_username, v_username, new.email,
    case when v_taken then null else v_phone end,
    v_country,
    nullif(btrim(coalesce(v_meta->>'location', '')), ''),
    now(), now()
  )
  on conflict (user_id) do nothing;

  if v_phone is not null then
    if v_taken then
      insert into public.phone_verifications (user_id, phone, phone_country)
      values (new.id, v_phone, v_country)
      on conflict (user_id) do update set phone = excluded.phone, phone_country = excluded.phone_country, updated_at = now();
    else
      insert into public.phone_history (user_id, old_phone, new_phone, reason)
      values (new.id, null, v_phone, 'signup');
    end if;
  end if;

  perform public.ensure_wallet(new.id);
  return new;
end $$;

drop function if exists public.initialize_user_profile_on_signup();

-- -----------------------------------------------------------------------------
-- 5. Username change (called by the server after re-authentication)
-- -----------------------------------------------------------------------------
create or replace function public.change_username(p_user uuid, p_new text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_new text := lower(btrim(coalesce(p_new, '')));
begin
  if v_new !~ '^[a-z0-9_.]{3,30}$' then
    raise exception 'Username must be 3-30 characters: letters, numbers, underscore or dot' using errcode = '22023';
  end if;

  select username into v_old from public."user" where user_id = p_user for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if v_old = v_new then
    return v_new;
  end if;

  if (select count(*) from public.username_history
       where user_id = p_user and changed_at > now() - interval '30 days') >= 6 then
    raise exception 'Username can be changed at most 6 times in 30 days' using errcode = '54000';
  end if;
  if not public.username_is_free(v_new, p_user) then
    raise exception 'Username already taken' using errcode = '23505';
  end if;

  update public."user"
     set username = v_new, username_changed_at = now(), updated_at = now()
   where user_id = p_user;
  insert into public.username_history (user_id, old_username, new_username)
  values (p_user, v_old, v_new);
  return v_new;
end $$;

revoke all on function public.change_username(uuid, text) from public, anon, authenticated;
grant execute on function public.change_username(uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- 6. Phone lifecycle (server-side only)
-- -----------------------------------------------------------------------------
create or replace function public.revoke_other_sessions(p_user uuid, p_keep_session uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from auth.sessions where user_id = p_user and (p_keep_session is null or id <> p_keep_session);
$$;

-- Update button: link a free number, or park a held one for verification.
create or replace function public.set_user_phone(p_user uuid, p_raw text, p_country text, p_keep_session uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country text := nullif(upper(btrim(coalesce(p_country, ''))), '');
  v_phone text := public.normalise_e164(p_raw, v_country);
  v_current text;
  v_holder_verified boolean;
begin
  if v_phone is null then
    return jsonb_build_object('status', 'invalid');
  end if;

  select phone into v_current from public."user" where user_id = p_user for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_current = v_phone then
    delete from public.phone_verifications where user_id = p_user and phone = v_phone;
    return jsonb_build_object('status', 'unchanged', 'phone', v_phone);
  end if;

  select phone_verified into v_holder_verified
    from public."user" where phone = v_phone and user_id <> p_user;
  if found then
    insert into public.phone_verifications (user_id, phone, phone_country)
    values (p_user, v_phone, v_country)
    on conflict (user_id) do update
      set phone = excluded.phone, phone_country = excluded.phone_country,
          token = null, token_expires_at = null, chat_id = null, updated_at = now();
    return jsonb_build_object('status', 'conflict', 'phone', v_phone, 'holder_verified', v_holder_verified);
  end if;

  if v_current is not null and exists (
       select 1 from public.phone_history
        where user_id = p_user and reason in ('update', 'verified', 'revert')
          and changed_at > now() - interval '7 days') then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  update public."user"
     set phone = v_phone, phone_country = coalesce(v_country, phone_country),
         phone_verified = false, phone_verified_at = null, updated_at = now()
   where user_id = p_user;
  delete from public.phone_verifications where user_id = p_user;
  insert into public.phone_history (user_id, old_phone, new_phone, reason, revert_until)
  values (p_user, v_current, v_phone, 'update',
          case when v_current is not null then now() + interval '24 hours' end);

  if v_current is not null then
    perform public.revoke_other_sessions(p_user, p_keep_session);
  end if;

  return jsonb_build_object('status', 'updated', 'phone', v_phone, 'previous', v_current);
end $$;

-- Verify button: issue a one-time token for the number awaiting proof.
create or replace function public.start_phone_verification(p_user uuid, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target text;
  v_country text;
begin
  select phone, phone_country into v_target, v_country from public.phone_verifications where user_id = p_user;
  if v_target is null then
    select phone, phone_country into v_target, v_country
      from public."user" where user_id = p_user and phone is not null and not phone_verified;
  end if;
  if v_target is null then
    return jsonb_build_object('status', 'nothing_to_verify');
  end if;

  insert into public.phone_verifications (user_id, phone, phone_country, token, token_expires_at)
  values (p_user, v_target, v_country, p_token, now() + interval '15 minutes')
  on conflict (user_id) do update
    set token = excluded.token, token_expires_at = excluded.token_expires_at,
        chat_id = null, updated_at = now();
  return jsonb_build_object('status', 'started', 'phone', v_target);
end $$;

-- Bot /start <token>: bind the Telegram chat to the pending verification.
create or replace function public.bind_phone_verification_chat(p_token text, p_chat_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  update public.phone_verifications
     set chat_id = p_chat_id, updated_at = now()
   where token = p_token and token_expires_at > now()
  returning user_id into v_user;
  return v_user;
end $$;

-- Bot received the user's own contact: Telegram vouches for that number.
create or replace function public.claim_verified_phone(p_chat_id text, p_phone text, p_telegram_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pv public.phone_verifications%rowtype;
  v_phone text := public.normalise_e164(p_phone, null);
  v_old text;
  v_prev uuid;
begin
  select * into v_pv from public.phone_verifications
   where chat_id = p_chat_id and token_expires_at > now()
   order by updated_at desc limit 1
   for update;
  if not found then
    return jsonb_build_object('status', 'no_pending');
  end if;
  if v_phone is null or v_phone <> v_pv.phone then
    return jsonb_build_object('status', 'mismatch', 'expected', v_pv.phone);
  end if;

  -- release the number from whoever holds it now
  select user_id into v_prev from public."user" where phone = v_phone and user_id <> v_pv.user_id for update;
  if v_prev is not null then
    update public."user" set phone = null, phone_verified = false, phone_verified_at = null, updated_at = now()
     where user_id = v_prev;
    insert into public.phone_history (user_id, old_phone, new_phone, reason) values (v_prev, v_phone, null, 'released');
  end if;
  delete from public.phone_verifications where phone = v_phone and user_id <> v_pv.user_id;

  select phone into v_old from public."user" where user_id = v_pv.user_id for update;
  update public."user"
     set phone = v_phone, phone_country = coalesce(v_pv.phone_country, phone_country),
         phone_verified = true, phone_verified_at = now(), updated_at = now()
   where user_id = v_pv.user_id;
  if v_old is distinct from v_phone then
    insert into public.phone_history (user_id, old_phone, new_phone, reason, revert_until)
    values (v_pv.user_id, v_old, v_phone, 'verified',
            case when v_old is not null then now() + interval '24 hours' end);
  end if;

  insert into public.user_telegram_links (user_id, chat_id, telegram_user_id)
  values (v_pv.user_id, p_chat_id, p_telegram_user_id)
  on conflict (user_id) do update set chat_id = excluded.chat_id, telegram_user_id = excluded.telegram_user_id, linked_at = now();
  delete from public.phone_verifications where user_id = v_pv.user_id;

  if v_old is not null and v_old is distinct from v_phone then
    perform public.revoke_other_sessions(v_pv.user_id, null);
  end if;

  return jsonb_build_object('status', 'verified', 'user_id', v_pv.user_id, 'phone', v_phone,
                            'previous_holder', v_prev, 'previous_phone', v_old);
end $$;

-- Undo the latest phone change inside its 24 hour window.
create or replace function public.revert_phone_change(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.phone_history%rowtype;
begin
  select * into h from public.phone_history
   where user_id = p_user and reason in ('update', 'verified')
     and revert_until > now() and reverted_at is null
   order by changed_at desc limit 1
   for update;
  if not found then
    return jsonb_build_object('status', 'nothing_to_revert');
  end if;
  if h.old_phone is not null and exists (select 1 from public."user" where phone = h.old_phone and user_id <> p_user) then
    return jsonb_build_object('status', 'old_number_taken');
  end if;

  update public."user"
     set phone = h.old_phone, phone_verified = false, phone_verified_at = null, updated_at = now()
   where user_id = p_user;
  update public.phone_history set reverted_at = now() where id = h.id;
  insert into public.phone_history (user_id, old_phone, new_phone, reason)
  values (p_user, h.new_phone, h.old_phone, 'revert');
  return jsonb_build_object('status', 'reverted', 'phone', h.old_phone);
end $$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.revoke_other_sessions(uuid, uuid)',
    'public.set_user_phone(uuid, text, text, uuid)',
    'public.start_phone_verification(uuid, text)',
    'public.bind_phone_verification_chat(text, text)',
    'public.claim_verified_phone(text, text, text)',
    'public.revert_phone_change(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 7. Role management
-- -----------------------------------------------------------------------------
insert into public.settings (scope, key, value)
values ('security', 'master_admin_user_id', to_jsonb('169e9fe8-daae-4542-94df-8d8d1ed4a5e8'::text))
on conflict (scope, key) do update set value = excluded.value;

update public."user" set role = 'admin', updated_at = now()
 where user_id = '169e9fe8-daae-4542-94df-8d8d1ed4a5e8';

create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public."user" where user_id = p_user and role = 'admin')
$$;

create or replace function public.update_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_master uuid;
  v_old text;
begin
  if new_role not in ('user', 'manager', 'admin') then
    raise exception 'Invalid role. Choose user, manager, or admin.' using errcode = '22023';
  end if;
  if not public.is_admin(v_caller) then
    raise exception 'Unauthorized. Only admins can modify user privileges.' using errcode = '42501';
  end if;

  select (value #>> '{}')::uuid into v_master from public.settings
   where scope = 'security' and key = 'master_admin_user_id';
  if target_user_id = v_master and new_role <> 'admin' then
    raise exception 'The master admin cannot be demoted.' using errcode = '42501';
  end if;
  if target_user_id = v_caller and v_caller is distinct from v_master then
    raise exception 'You cannot change your own role.' using errcode = '42501';
  end if;

  select role::text into v_old from public."user" where user_id = target_user_id for update;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
  if v_old = new_role then
    return;
  end if;

  update public."user" set role = new_role::user_role, updated_at = now() where user_id = target_user_id;
  insert into public.admin_actions (admin_id, action, target_type, target_id, details)
  values (v_caller, 'update_user_role', 'user', target_user_id::text,
          jsonb_build_object('from', v_old, 'to', new_role));
end $$;

create or replace function public.admin_list_users(p_search text default null, p_role text default null,
                                                   p_limit int default 50, p_offset int default 0)
returns table (id uuid, email text, username text, display_name text, avatar_url text,
               role text, is_banned boolean, created_at timestamptz, is_master boolean, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_master uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Unauthorized. Only admins can list users.' using errcode = '42501';
  end if;
  select (value #>> '{}')::uuid into v_master from public.settings
   where scope = 'security' and key = 'master_admin_user_id';

  return query
    select u.user_id, u.email, u.username, u.display_name, u.avatar_url, u.role::text,
           coalesce(u.is_banned, false), u.created_at, u.user_id = v_master,
           count(*) over ()
      from public."user" u
     where (p_role is null or u.role::text = p_role)
       and (p_search is null or p_search = ''
            or u.username ilike '%' || p_search || '%'
            or u.display_name ilike '%' || p_search || '%'
            or u.email ilike '%' || p_search || '%')
     order by (u.role = 'admin') desc, (u.role = 'manager') desc, u.created_at desc
     limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
end $$;

revoke all on function public.is_admin(uuid) from public, anon;
revoke all on function public.update_user_role(uuid, text) from public, anon;
revoke all on function public.admin_list_users(text, text, int, int) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.update_user_role(uuid, text) to authenticated;
grant execute on function public.admin_list_users(text, text, int, int) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Hardening: RLS stays auth.uid() = user_id; column privileges close the gaps
-- -----------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger on public."user" from anon, authenticated;
grant update (display_name, full_name, avatar_url, bio, location, cover_url, website, birth_date, gender,
              is_private, interest_tags, last_seen, default_stream_title, stream_quality, push_token,
              profile_completed, hide_rank, updated_at)
  on public."user" to authenticated;

-- Other users' email and phone are private: grant SELECT on every column except
-- those. Columns added later must be granted explicitly.
revoke select on public."user" from anon, authenticated;
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into v_cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'user'
     and column_name not in ('email', 'phone', 'phone_hash', 'phone_country', 'push_token');
  execute format('grant select (%s) on public."user" to authenticated', v_cols);
end $$;

revoke insert, update, delete, truncate, references, trigger on public.profiles from anon;
revoke truncate, references, trigger on public.profiles from authenticated;

-- The view triggers run as definer, so they must check ownership themselves.
create or replace function public.profiles_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid := coalesce(new.id, new.user_id, old.id, old.user_id);
begin
  if auth.role() is distinct from 'service_role' and auth.uid() is distinct from v_target then
    raise exception 'You can only update your own profile' using errcode = '42501';
  end if;
  update public."user"
     set display_name = coalesce(new.full_name, old.full_name),
         avatar_url = coalesce(new.avatar_url, old.avatar_url),
         bio = coalesce(new.bio, old.bio),
         updated_at = now()
   where user_id = v_target;
  return new;
end $$;

create or replace function public.profiles_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Profiles are removed through account deletion' using errcode = '42501';
  end if;
  delete from public."user" where user_id = coalesce(old.id, old.user_id);
  return old;
end $$;

create or replace function public.profiles_insert_handler()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid := coalesce(new.id, new.user_id);
begin
  if auth.role() is distinct from 'service_role' and auth.uid() is distinct from v_target then
    raise exception 'You can only create your own profile' using errcode = '42501';
  end if;
  insert into public."user" (user_id, username, display_name, avatar_url, bio, created_at, updated_at)
  values (v_target,
          public.unique_username(coalesce(new.username, 'user'), v_target),
          coalesce(new.full_name, new.username),
          new.avatar_url, new.bio, now(), now())
  on conflict (user_id) do nothing;
  return new;
end $$;

commit;
