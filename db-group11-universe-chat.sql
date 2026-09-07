-- Universe (global) chat access: readable by any authenticated user,
-- writable only as yourself. RLS was enabled with no policies, which blocked
-- every read and write through the anon/authenticated roles.

alter table public.universe_messages enable row level security;

drop policy if exists universe_messages_select on public.universe_messages;
create policy universe_messages_select
  on public.universe_messages
  for select
  to authenticated
  using (true);

drop policy if exists universe_messages_insert on public.universe_messages;
create policy universe_messages_insert
  on public.universe_messages
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists universe_messages_delete on public.universe_messages;
create policy universe_messages_delete
  on public.universe_messages
  for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists universe_messages_created_idx
  on public.universe_messages (created_at desc);
