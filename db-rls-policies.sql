-- Row Level Security policies for tables that had RLS enabled but no policies,
-- which made them unreadable and unwritable for every signed-in user.
--
-- Conventions:
--   * "public" content (posts, comments, likes, tags, catalogs, live streams) is
--     readable by any authenticated user, writable only by its owner.
--   * private records are scoped to the owner (or to both parties of a
--     conversation / trade / escrow).
--   * the service role bypasses RLS and is unaffected by these policies.
--
-- Safe to re-run: every policy is dropped before being (re)created.

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_chat_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_room_members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_chat_room_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- social content
-- ---------------------------------------------------------------------------

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts
  for select to authenticated using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists post_likes_read on public.post_likes;
create policy post_likes_read on public.post_likes
  for select to authenticated using (true);

drop policy if exists post_likes_write_own on public.post_likes;
create policy post_likes_write_own on public.post_likes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists post_likes_delete_own on public.post_likes;
create policy post_likes_delete_own on public.post_likes
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists post_comments_read on public.post_comments;
create policy post_comments_read on public.post_comments
  for select to authenticated using (true);

drop policy if exists post_comments_write_own on public.post_comments;
create policy post_comments_write_own on public.post_comments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists post_comments_update_own on public.post_comments;
create policy post_comments_update_own on public.post_comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists post_comments_delete_own on public.post_comments;
create policy post_comments_delete_own on public.post_comments
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments
  for select to authenticated using (true);

drop policy if exists comments_write_own on public.comments;
create policy comments_write_own on public.comments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists post_tags_read on public.post_tags;
create policy post_tags_read on public.post_tags
  for select to authenticated using (true);

drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags
  for select to authenticated using (true);

drop policy if exists trending_hashtags_read on public.trending_hashtags;
create policy trending_hashtags_read on public.trending_hashtags
  for select to authenticated using (true);

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows
  for select to authenticated using (true);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
  for insert to authenticated with check (follower_id = auth.uid());

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows
  for delete to authenticated using (follower_id = auth.uid());

drop policy if exists user_blocks_own on public.user_blocks;
create policy user_blocks_own on public.user_blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

drop policy if exists user_interactions_own on public.user_interactions;
create policy user_interactions_own on public.user_interactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists reports_read_own on public.reports;
create policy reports_read_own on public.reports
  for select to authenticated using (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- statuses
-- ---------------------------------------------------------------------------

drop policy if exists user_statuses_read on public.user_statuses;
create policy user_statuses_read on public.user_statuses
  for select to authenticated using (expires_at is null or expires_at > now());

drop policy if exists user_statuses_write_own on public.user_statuses;
create policy user_statuses_write_own on public.user_statuses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists user_statuses_delete_own on public.user_statuses;
create policy user_statuses_delete_own on public.user_statuses
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists status_views_read on public.status_views;
create policy status_views_read on public.status_views
  for select to authenticated using (
    viewer_id = auth.uid()
    or exists (
      select 1 from public.user_statuses s
      where s.id = status_views.status_id and s.user_id = auth.uid()
    )
  );

drop policy if exists status_views_insert_own on public.status_views;
create policy status_views_insert_own on public.status_views
  for insert to authenticated with check (viewer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- chat & calls
-- ---------------------------------------------------------------------------

drop policy if exists chat_rooms_member_read on public.chat_rooms;
create policy chat_rooms_member_read on public.chat_rooms
  for select to authenticated using (public.is_chat_room_member(id));

drop policy if exists chat_rooms_insert_own on public.chat_rooms;
create policy chat_rooms_insert_own on public.chat_rooms
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists chat_rooms_update_creator on public.chat_rooms;
create policy chat_rooms_update_creator on public.chat_rooms
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists chat_room_members_read on public.chat_room_members;
create policy chat_room_members_read on public.chat_room_members
  for select to authenticated using (user_id = auth.uid() or public.is_chat_room_member(room_id));

drop policy if exists chat_room_members_insert on public.chat_room_members;
create policy chat_room_members_insert on public.chat_room_members
  for insert to authenticated with check (user_id = auth.uid() or public.is_chat_room_member(room_id));

drop policy if exists chat_room_members_delete_own on public.chat_room_members;
create policy chat_room_members_delete_own on public.chat_room_members
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists chat_messages_member_read on public.chat_messages;
create policy chat_messages_member_read on public.chat_messages
  for select to authenticated using (public.is_chat_room_member(room_id));

drop policy if exists chat_messages_send on public.chat_messages;
create policy chat_messages_send on public.chat_messages
  for insert to authenticated with check (sender_id = auth.uid() and public.is_chat_room_member(room_id));

drop policy if exists chat_messages_update_own on public.chat_messages;
create policy chat_messages_update_own on public.chat_messages
  for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

drop policy if exists chat_messages_delete_own on public.chat_messages;
create policy chat_messages_delete_own on public.chat_messages
  for delete to authenticated using (sender_id = auth.uid());

drop policy if exists chat_message_reactions_read on public.chat_message_reactions;
create policy chat_message_reactions_read on public.chat_message_reactions
  for select to authenticated using (
    exists (
      select 1 from public.chat_messages m
      where m.id = chat_message_reactions.message_id
        and public.is_chat_room_member(m.room_id)
    )
  );

drop policy if exists chat_message_reactions_write_own on public.chat_message_reactions;
create policy chat_message_reactions_write_own on public.chat_message_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists chat_read_receipts_read on public.chat_read_receipts;
create policy chat_read_receipts_read on public.chat_read_receipts
  for select to authenticated using (user_id = auth.uid() or public.is_chat_room_member(room_id));

drop policy if exists chat_read_receipts_write_own on public.chat_read_receipts;
create policy chat_read_receipts_write_own on public.chat_read_receipts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists chat_typing_status_read on public.chat_typing_status;
create policy chat_typing_status_read on public.chat_typing_status
  for select to authenticated using (public.is_chat_room_member(room_id));

drop policy if exists chat_typing_status_write_own on public.chat_typing_status;
create policy chat_typing_status_write_own on public.chat_typing_status
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists call_sessions_party on public.call_sessions;
create policy call_sessions_party on public.call_sessions
  for select to authenticated using (host_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists call_sessions_host_write on public.call_sessions;
create policy call_sessions_host_write on public.call_sessions
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists call_sessions_party_update on public.call_sessions;
create policy call_sessions_party_update on public.call_sessions
  for update to authenticated
  using (host_id = auth.uid() or recipient_id = auth.uid())
  with check (host_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists call_signaling_party on public.call_signaling_payloads;
create policy call_signaling_party on public.call_signaling_payloads
  for select to authenticated using (
    exists (
      select 1 from public.call_sessions c
      where c.id = call_signaling_payloads.call_id
        and (c.host_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

drop policy if exists call_signaling_send on public.call_signaling_payloads;
create policy call_signaling_send on public.call_signaling_payloads
  for insert to authenticated with check (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- streaming
-- ---------------------------------------------------------------------------

drop policy if exists streams_read on public.streams;
create policy streams_read on public.streams
  for select to authenticated using (true);

drop policy if exists streams_write_own on public.streams;
create policy streams_write_own on public.streams
  for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists streams_update_own on public.streams;
create policy streams_update_own on public.streams
  for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists streams_delete_own on public.streams;
create policy streams_delete_own on public.streams
  for delete to authenticated using (creator_id = auth.uid());

drop policy if exists stream_chats_read on public.stream_chats;
create policy stream_chats_read on public.stream_chats
  for select to authenticated using (true);

drop policy if exists stream_chats_send on public.stream_chats;
create policy stream_chats_send on public.stream_chats
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- gifting
-- ---------------------------------------------------------------------------

drop policy if exists gift_catalog_read on public.gift_catalog;
create policy gift_catalog_read on public.gift_catalog
  for select to authenticated using (true);

drop policy if exists gift_limits_own on public.gift_limits;
create policy gift_limits_own on public.gift_limits
  for select to authenticated using (user_id = auth.uid());

drop policy if exists gift_transactions_party on public.gift_transactions;
create policy gift_transactions_party on public.gift_transactions
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists gift_transactions_send on public.gift_transactions;
create policy gift_transactions_send on public.gift_transactions
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists post_gifts_read on public.post_gifts;
create policy post_gifts_read on public.post_gifts
  for select to authenticated using (true);

drop policy if exists post_gifts_send on public.post_gifts;
create policy post_gifts_send on public.post_gifts
  for insert to authenticated with check (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- escrow
-- ---------------------------------------------------------------------------

drop policy if exists escrow_agreements_party on public.escrow_agreements;
create policy escrow_agreements_party on public.escrow_agreements
  for select to authenticated using (
    client_id = auth.uid() or provider_id = auth.uid() or arbitrator_id = auth.uid()
  );

drop policy if exists escrow_agreements_create on public.escrow_agreements;
create policy escrow_agreements_create on public.escrow_agreements
  for insert to authenticated with check (client_id = auth.uid() or provider_id = auth.uid());

drop policy if exists escrow_agreements_party_update on public.escrow_agreements;
create policy escrow_agreements_party_update on public.escrow_agreements
  for update to authenticated
  using (client_id = auth.uid() or provider_id = auth.uid())
  with check (client_id = auth.uid() or provider_id = auth.uid());

drop policy if exists escrow_milestones_party on public.escrow_milestones;
create policy escrow_milestones_party on public.escrow_milestones
  for select to authenticated using (
    exists (
      select 1 from public.escrow_agreements a
      where a.id = escrow_milestones.escrow_id
        and (a.client_id = auth.uid() or a.provider_id = auth.uid() or a.arbitrator_id = auth.uid())
    )
  );

drop policy if exists escrow_disputes_party on public.escrow_disputes;
create policy escrow_disputes_party on public.escrow_disputes
  for select to authenticated using (initiated_by = auth.uid());

drop policy if exists escrow_disputes_open on public.escrow_disputes;
create policy escrow_disputes_open on public.escrow_disputes
  for insert to authenticated with check (initiated_by = auth.uid());

-- ---------------------------------------------------------------------------
-- activity logs owned by the user
-- ---------------------------------------------------------------------------

drop policy if exists audit_logs_read_own on public.audit_logs;
create policy audit_logs_read_own on public.audit_logs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists feed_generation_logs_own on public.feed_generation_logs;
create policy feed_generation_logs_own on public.feed_generation_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists gamification_activity_log_read_own on public.gamification_activity_log;
create policy gamification_activity_log_read_own on public.gamification_activity_log
  for select to authenticated using (user_id = auth.uid());

drop policy if exists support_contacts_own on public.support_contacts;
create policy support_contacts_own on public.support_contacts
  for select to authenticated using (user_id = auth.uid());

drop policy if exists support_contacts_create on public.support_contacts;
create policy support_contacts_create on public.support_contacts
  for insert to authenticated with check (user_id = auth.uid());
