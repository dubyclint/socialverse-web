-- The `profiles` view is the app's read model for *any* user (post authors,
-- comment authors, contact sync, admin lists), but it carried a
-- `user_id = auth.uid()` filter, so every lookup of somebody else returned no
-- row. The view keeps security_invoker, so the base table's RLS — which already
-- allows an authenticated user to read all profile rows — is what governs.
create or replace view public.profiles
with (security_invoker = true) as
  select
    user_id as id,
    user_id,
    username,
    display_name as full_name,
    avatar_url,
    bio,
    created_at,
    updated_at,
    location,
    is_verified,
    role,
    phone_hash,
    interest_tags
  from public."user";
