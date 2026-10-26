-- Keep public.user.posts_count in sync with the user's own (non-Page) posts.
create or replace function public.sync_user_posts_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.page_id is null then
    update public."user" set posts_count = coalesce(posts_count, 0) + 1 where user_id = new.user_id;
  elsif tg_op = 'DELETE' and old.page_id is null then
    update public."user" set posts_count = greatest(coalesce(posts_count, 0) - 1, 0) where user_id = old.user_id;
  end if;
  return null;
end $$;
drop trigger if exists posts_sync_user_count on public.posts;
create trigger posts_sync_user_count after insert or delete on public.posts
  for each row execute function public.sync_user_posts_count();
update public."user" u set posts_count = coalesce(c.n, 0)
from (select u2.user_id, (select count(*) from public.posts p where p.user_id = u2.user_id and p.page_id is null) n from public."user" u2) c
where c.user_id = u.user_id and coalesce(u.posts_count, -1) <> coalesce(c.n, 0);
