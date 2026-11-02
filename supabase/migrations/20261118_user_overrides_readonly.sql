-- Users could insert their own user_overrides rows (e.g. self-award monetization). Owners may only read;
-- all writes go through staff-gated server endpoints using the service role.
drop policy if exists user_overrides_owner_all on public.user_overrides;
drop policy if exists user_overrides_owner_select on public.user_overrides;
create policy user_overrides_owner_select on public.user_overrides for select using (user_id = auth.uid());
revoke insert, update, delete on public.user_overrides from anon, authenticated;
