-- Group 16: Main Chat unread counts and group creation support
begin;

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at desc);

create or replace function public.chat_unread_counts()
returns table (room_id uuid, unread bigint)
language sql
stable
security definer
set search_path = public
as $$
  select m.room_id, count(c.id)::bigint
    from public.chat_room_members m
    join public.chat_messages c
      on c.room_id = m.room_id
     and c.sender_id is distinct from m.user_id
     and c.deleted_at is null
     and c.created_at > coalesce(m.last_read_at, m.joined_at, '-infinity'::timestamptz)
   where m.user_id = auth.uid()
     and coalesce(m.is_archived, false) = false
   group by m.room_id
$$;

revoke all on function public.chat_unread_counts() from public, anon;
grant execute on function public.chat_unread_counts() to authenticated;

create or replace function public.create_group_chat(p_name text, p_avatar text, p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_room uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_members uuid[];
begin
  if v_caller is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'Group name must be 1-80 characters' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct u.user_id), '{}') into v_members
    from public."user" u
   where u.user_id = any(coalesce(p_members, '{}'))
     and u.user_id <> v_caller
     and coalesce(u.is_banned, false) = false;

  if cardinality(v_members) < 1 then
    raise exception 'Add at least one member' using errcode = '22023';
  end if;
  if cardinality(v_members) > 255 then
    raise exception 'Groups are limited to 256 members' using errcode = '22023';
  end if;

  insert into public.chat_rooms (is_group_chat, room_name, room_avatar, created_by, last_message_at)
  values (true, v_name, nullif(btrim(coalesce(p_avatar, '')), ''), v_caller, now())
  returning id into v_room;

  insert into public.chat_room_members (room_id, user_id, member_role)
  values (v_room, v_caller, 'admin');

  insert into public.chat_room_members (room_id, user_id, member_role)
  select v_room, m, 'member' from unnest(v_members) as m;

  insert into public.chat_messages (room_id, sender_id, message_text, message_type)
  values (v_room, v_caller, 'created the group "' || v_name || '"', 'system');

  return v_room;
end $$;

revoke all on function public.create_group_chat(text, text, uuid[]) from public, anon;
grant execute on function public.create_group_chat(text, text, uuid[]) to authenticated;

commit;
