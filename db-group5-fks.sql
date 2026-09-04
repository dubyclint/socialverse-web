-- PostgREST can only embed related rows when a foreign key exists. posts had no
-- foreign keys at all, so `posts -> profiles` embeds (the main feed query) failed
-- with "Could not find a relationship ... in the schema cache".
alter table public.posts
  drop constraint if exists posts_user_id_fkey,
  add constraint posts_user_id_fkey foreign key (user_id)
    references public."user"(user_id) on delete cascade;

-- The posts API filters and writes these, but the live table only had content.
alter table public.posts add column if not exists title text;
alter table public.posts add column if not exists is_draft boolean not null default false;
alter table public.posts add column if not exists privacy text not null default 'public'
  check (privacy in ('public','friends','private'));
alter table public.posts add column if not exists scheduled_at timestamptz;
create index if not exists posts_visible_idx on public.posts (created_at desc) where is_draft = false;
