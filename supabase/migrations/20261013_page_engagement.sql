-- Likes and comments made while acting as a Page are attributed to the Page.
-- user_id stays the human (audit / RLS); page_id marks the Page identity.

alter table public.post_likes
  add column if not exists page_id uuid references public.pages(id) on delete cascade;
alter table public.post_comments
  add column if not exists page_id uuid references public.pages(id) on delete cascade;

-- One like per person and one like per Page, independently.
alter table public.post_likes drop constraint if exists unique_post_user_like;
drop index if exists public.unique_post_user_like;
create unique index if not exists unique_post_user_like
  on public.post_likes (post_id, user_id) where page_id is null;
create unique index if not exists unique_post_page_like
  on public.post_likes (post_id, page_id) where page_id is not null;

-- A row may only carry a page_id the writer actually manages.
create or replace function public.assert_page_actor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.page_id is not null and not exists (
    select 1 from page_admins where page_id = new.page_id and user_id = new.user_id
  ) then
    raise exception 'You do not manage this Page' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists post_likes_page_actor on public.post_likes;
create trigger post_likes_page_actor before insert or update of page_id, user_id on public.post_likes
  for each row execute function public.assert_page_actor();
drop trigger if exists post_comments_page_actor on public.post_comments;
create trigger post_comments_page_actor before insert or update of page_id, user_id on public.post_comments
  for each row execute function public.assert_page_actor();

drop function if exists public.set_post_like(uuid, boolean);
create or replace function public.set_post_like(p_post_id uuid, p_liked boolean, p_page_id uuid default null)
returns table(liked boolean, likes_count integer, changed boolean)
language plpgsql security definer set search_path = public as $$
declare
  viewer uuid := auth.uid();
  affected integer;
begin
  if viewer is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from posts where id = p_post_id) then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  if p_page_id is not null and not exists (
    select 1 from page_admins where page_id = p_page_id and user_id = viewer
  ) then
    raise exception 'You do not manage this Page' using errcode = '42501';
  end if;

  if p_liked then
    if p_page_id is null then
      insert into post_likes (post_id, user_id) values (p_post_id, viewer)
      on conflict (post_id, user_id) where page_id is null do nothing;
    else
      insert into post_likes (post_id, user_id, page_id) values (p_post_id, viewer, p_page_id)
      on conflict (post_id, page_id) where page_id is not null do nothing;
    end if;
  elsif p_page_id is null then
    delete from post_likes where post_id = p_post_id and user_id = viewer and page_id is null;
  else
    delete from post_likes where post_id = p_post_id and page_id = p_page_id;
  end if;
  get diagnostics affected = row_count;

  return query
    select p_liked, p.likes_count, affected > 0 from posts p where p.id = p_post_id;
end $$;

grant execute on function public.set_post_like(uuid, boolean, uuid) to authenticated;

-- Any admin of the Page may undo a like the Page made.
drop policy if exists post_likes_delete_page on public.post_likes;
create policy post_likes_delete_page on public.post_likes for delete
  using (page_id is not null and exists (
    select 1 from page_admins pa where pa.page_id = post_likes.page_id and pa.user_id = auth.uid()
  ));
