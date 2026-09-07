-- Chat room creators must be able to read back the room they just created,
-- before the membership rows exist. Without this, creating a direct chat
-- fails on the RETURNING clause with an RLS violation.
drop policy if exists chat_rooms_member_read on public.chat_rooms;
create policy chat_rooms_member_read on public.chat_rooms
  for select to authenticated
  using (created_by = auth.uid() or is_chat_room_member(id));
