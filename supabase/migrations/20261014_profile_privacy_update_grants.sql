-- Owners edit their privacy/info fields through /api/profile/update (row limited
-- by the user_update_own RLS policy). SELECT stays ungranted: other users only
-- see these through /api/profile/:id, which applies per-field visibility.
grant update (marital_status, university, work, religion, profile_locked, show_online, field_visibility)
  on public."user" to authenticated;
