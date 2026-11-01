-- Per-account login lockout: 3 failures -> 12 min lock; after that, 5 more failures -> 30 min lock (repeats).
-- Keys are sha256 of the lower-cased email so no address is stored. Server-only (service role).
create table if not exists public.auth_login_guards (
  key text primary key,
  fails int not null default 0,
  stage int not null default 0,
  locked_until timestamptz,
  last_fail_at timestamptz,
  last_ip text
);
alter table public.auth_login_guards enable row level security;
revoke all on public.auth_login_guards from anon, authenticated;

create or replace function public.login_guard_check(p_key text)
returns timestamptz language sql stable security definer set search_path = public as $$
  select locked_until from auth_login_guards where key = p_key and locked_until > now()
$$;

create or replace function public.login_guard_fail(p_key text, p_ip text)
returns table (locked_until timestamptz, attempts_left int) language plpgsql security definer set search_path = public as $$
declare g auth_login_guards%rowtype;
begin
  insert into auth_login_guards as a (key) values (p_key) on conflict (key) do nothing;
  select * into g from auth_login_guards a where a.key = p_key for update;
  if g.last_fail_at is null or g.last_fail_at < now() - interval '24 hours' then g.fails := 0; g.stage := 0; end if;
  g.fails := g.fails + 1;
  g.locked_until := null;
  if g.stage = 0 and g.fails >= 3 then
    g.locked_until := now() + interval '12 minutes'; g.stage := 1; g.fails := 0;
  elsif g.stage >= 1 and g.fails >= 5 then
    g.locked_until := now() + interval '30 minutes'; g.stage := 2; g.fails := 0;
  end if;
  update auth_login_guards a set fails = g.fails, stage = g.stage, locked_until = g.locked_until, last_fail_at = now(), last_ip = p_ip
   where a.key = p_key;
  return query select g.locked_until, case when g.locked_until is not null then 0 when g.stage = 0 then 3 - g.fails else 5 - g.fails end;
end $$;

create or replace function public.login_guard_success(p_key text)
returns void language sql security definer set search_path = public as $$
  delete from auth_login_guards where key = p_key
$$;

revoke all on function public.login_guard_check(text), public.login_guard_fail(text, text), public.login_guard_success(text) from public, anon, authenticated;
