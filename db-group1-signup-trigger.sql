-- =============================================================================
-- Group 1 — repair the signup trigger
-- =============================================================================
-- `handle_new_user_signup` inserted into the `profiles` view, whose INSTEAD OF
-- trigger reads NEW.display_name — a column the view does not expose (it is
-- projected as full_name). Every signup therefore raised
--   record "new" has no field "display_name"
-- which the trigger's EXCEPTION block swallowed into a WARNING, leaving the new
-- auth user without a `public.user` row.
--
-- The trigger now writes to the base table directly.
-- =============================================================================

create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."user" (user_id, username, email, display_name, created_at, updated_at)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->'options'->'data'->>'username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name'
    ),
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  perform public.ensure_wallet(new.id);

  return new;
end;
$$;

-- The `profiles` view exposes display_name as full_name; its INSTEAD OF trigger
-- must read the view's own columns.
create or replace function public.profiles_insert_handler()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."user" (user_id, username, display_name, avatar_url, bio, created_at, updated_at)
  values (
    coalesce(new.id, new.user_id),
    new.username,
    new.full_name,
    new.avatar_url,
    new.bio,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (user_id) do update set
    username     = excluded.username,
    display_name = excluded.display_name,
    avatar_url   = excluded.avatar_url,
    bio          = excluded.bio,
    updated_at   = now();

  return new;
end;
$$;

drop trigger if exists profiles_insert_trigger on public.profiles;
create trigger profiles_insert_trigger
  instead of insert on public.profiles
  for each row execute function public.profiles_insert_handler();
