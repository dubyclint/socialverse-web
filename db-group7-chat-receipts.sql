-- Chat delivery and read receipts.
-- Per-member watermarks (the WhatsApp/Signal model): a message counts as
-- delivered/read when every other member's watermark is at or past its
-- created_at. Cheaper than a row per message per recipient and enough for
-- both direct chats and groups.

alter table public.chat_room_members
  add column if not exists last_delivered_at timestamptz,
  add column if not exists last_read_at timestamptz;

create index if not exists chat_room_members_room_user_idx
  on public.chat_room_members (room_id, user_id);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at desc);

-- Members may update their own watermark rows.
drop policy if exists chat_room_members_self_update on public.chat_room_members;
create policy chat_room_members_self_update on public.chat_room_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
