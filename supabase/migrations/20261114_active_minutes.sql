-- Daily active time per user, accumulated from presence heartbeats (monetization "daily active presence").
create table if not exists public.user_active_minutes (
  user_id uuid not null,
  day date not null,
  seconds integer not null default 0,
  last_ping timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.user_active_minutes enable row level security;
revoke all on public.user_active_minutes from anon, authenticated;

create or replace function public.track_active_time(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'utc')::date;
  prev timestamptz;
begin
  select last_ping into prev from public.user_active_minutes where user_id = p_user and day = d for update;
  if not found then
    insert into public.user_active_minutes (user_id, day, seconds, last_ping) values (p_user, d, 0, now())
    on conflict (user_id, day) do nothing;
    return;
  end if;
  update public.user_active_minutes
     set seconds = seconds + case when now() - prev <= interval '3 minutes' then greatest(0, extract(epoch from now() - prev)::int) else 0 end,
         last_ping = now()
   where user_id = p_user and day = d;
end $$;
revoke execute on function public.track_active_time(uuid) from public, anon, authenticated;
grant execute on function public.track_active_time(uuid) to service_role;
