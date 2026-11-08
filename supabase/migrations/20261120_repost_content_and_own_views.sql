-- Reposts may carry no comment of their own: allow empty content when the row is a repost.
alter table public.posts drop constraint if exists chk_content_presence;
alter table public.posts add constraint chk_content_presence
  check (char_length(trim(both from content)) > 0 or title like 'repost:%');

-- Post/Veep PEW gifts are raw amounts with no catalog gift.
alter table public.gift_transactions alter column gift_id drop not null;

-- Status replies that landed in a P2P trade room move to the pair's personal chat.
with moves as (
  select m.id as message_id,
         (select r.id from public.chat_rooms r
           where r.is_group_chat = false and r.page_id is null and r.page_visitor_id is null
             and r.id not in (select chat_room_id from public.p2p_trades where chat_room_id is not null)
             and exists (select 1 from public.chat_room_members a where a.room_id = r.id and a.user_id = m.sender_id)
             and exists (select 1 from public.chat_room_members b where b.room_id = r.id and b.user_id = (m.metadata->>'status_author_id')::uuid)
           order by r.created_at limit 1) as personal_id
    from public.chat_messages m
   where m.message_type = 'status_reply'
     and m.room_id in (select chat_room_id from public.p2p_trades where chat_room_id is not null)
)
update public.chat_messages c set room_id = moves.personal_id
  from moves where c.id = moves.message_id and moves.personal_id is not null;
