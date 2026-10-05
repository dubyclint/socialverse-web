-- Follow graph: live follower/following counters, following-list privacy,
-- follow notifications and the 4-month full-name change window.

alter table public."user" add column if not exists hide_following boolean not null default false;
alter table public."user" add column if not exists full_name_changed_at timestamptz;

create or replace function public.sync_follow_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update "user" set followers_count = followers_count + 1 where user_id = new.following_id;
    update "user" set following_count = following_count + 1 where user_id = new.follower_id;
    insert into notifications (recipient_id, notifier_id, event_type, message_text, source_id)
    values (new.following_id, new.follower_id, 'FOLLOW_RECEIVED', 'started following you', new.follower_id);
    return new;
  end if;

  update "user" set followers_count = greatest(followers_count - 1, 0) where user_id = old.following_id;
  update "user" set following_count = greatest(following_count - 1, 0) where user_id = old.follower_id;
  return old;
end;
$$;

drop trigger if exists follows_sync_counters on public.follows;
create trigger follows_sync_counters
  after insert or delete on public.follows
  for each row execute function public.sync_follow_counters();

revoke all on function public.sync_follow_counters() from public;

update public."user" u
set followers_count = (select count(*) from public.follows f where f.following_id = u.user_id),
    following_count = (select count(*) from public.follows f where f.follower_id = u.user_id);

grant select (hide_following, full_name_changed_at) on public."user" to authenticated;
grant update (hide_following) on public."user" to authenticated;

-- Full name may change at most once every 4 months; enforced for signed-in
-- callers however they reach the table. Service-role/admin writes are exempt.
create or replace function public.enforce_full_name_window()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.full_name is not distinct from old.full_name then
    new.full_name_changed_at := old.full_name_changed_at;
    return new;
  end if;

  if current_user = 'authenticated'
     and old.full_name_changed_at is not null
     and old.full_name_changed_at > now() - interval '120 days' then
    raise exception 'You can change your full name again on %',
      to_char(old.full_name_changed_at + interval '120 days', 'Dy Mon DD YYYY')
      using errcode = 'P0001';
  end if;

  new.full_name_changed_at := now();
  return new;
end;
$$;

drop trigger if exists user_full_name_window on public."user";
create trigger user_full_name_window
  before update of full_name on public."user"
  for each row execute function public.enforce_full_name_window();
