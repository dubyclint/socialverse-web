-- Badge type is public profile information (shown next to every name), like is_verified.
grant select (verified_type) on public."user" to authenticated, anon;
