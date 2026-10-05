-- Post engagement counters are maintained by the database so concurrent likes,
-- comments and shares can never overwrite each other's increments.

alter table public.post_comments add column if not exists edited_at timestamptz;

create or replace function public.bump_post_counter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  target uuid := case when tg_op = 'INSERT' then new.post_id else old.post_id end;
begin
  if tg_table_name = 'post_likes' then
    update posts set likes_count = greatest(likes_count + delta, 0) where id = target;
  elsif tg_table_name = 'post_comments' then
    update posts set comments_count = greatest(comments_count + delta, 0) where id = target;
  elsif tg_table_name = 'post_shares' then
    update posts set shares_count = greatest(shares_count + delta, 0) where id = target;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_counter on public.post_likes;
create trigger post_likes_counter
  after insert or delete on public.post_likes
  for each row execute function public.bump_post_counter();

drop trigger if exists post_comments_counter on public.post_comments;
create trigger post_comments_counter
  after insert or delete on public.post_comments
  for each row execute function public.bump_post_counter();

drop trigger if exists post_shares_counter on public.post_shares;
create trigger post_shares_counter
  after insert or delete on public.post_shares
  for each row execute function public.bump_post_counter();

-- Idempotent: replaying the same desired state (e.g. from an offline retry
-- queue) never double-counts.
create or replace function public.set_post_like(p_post_id uuid, p_liked boolean)
returns table (liked boolean, likes_count integer, changed boolean)
language plpgsql
security definer
set search_path = public
as $$
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

  if p_liked then
    insert into post_likes (post_id, user_id) values (p_post_id, viewer)
    on conflict (post_id, user_id) do nothing;
  else
    delete from post_likes where post_id = p_post_id and user_id = viewer;
  end if;
  get diagnostics affected = row_count;

  return query
    select p_liked, p.likes_count, affected > 0 from posts p where p.id = p_post_id;
end;
$$;

revoke all on function public.set_post_like(uuid, boolean) from public, anon;
grant execute on function public.set_post_like(uuid, boolean) to authenticated;

-- Bring every existing counter back in line with the rows it counts.
update public.posts p set
  likes_count = (select count(*) from public.post_likes l where l.post_id = p.id),
  comments_count = (select count(*) from public.post_comments c where c.post_id = p.id),
  shares_count = (select count(*) from public.post_shares s where s.post_id = p.id);
