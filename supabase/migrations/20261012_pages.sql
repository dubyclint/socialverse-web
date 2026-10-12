-- Sub-user Pages: polymorphic post authors (USER | PAGE) with page RBAC.
do $$ begin
  create type public.page_role as enum ('OWNER', 'MANAGER', 'MODERATOR');
exception when duplicate_object then null; end $$;

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  handle text not null unique check (handle ~ '^[a-z0-9_.]{3,30}$'),
  category text check (category is null or char_length(category) <= 60),
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_url text,
  cover_url text,
  website text,
  created_by_user_id uuid not null references public."user"(user_id) on delete cascade,
  followers_count integer not null default 0,
  posts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pages_created_by_idx on public.pages(created_by_user_id);

create table if not exists public.page_admins (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references public."user"(user_id) on delete cascade,
  role public.page_role not null,
  created_at timestamptz not null default now(),
  unique (page_id, user_id)
);
create index if not exists page_admins_user_idx on public.page_admins(user_id);

create table if not exists public.page_follows (
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references public."user"(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);
create index if not exists page_follows_user_idx on public.page_follows(user_id);

-- Creation cap: invited admin roles never count, only pages a user created.
create or replace function public.enforce_page_creation_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.pages where created_by_user_id = new.created_by_user_id) >= 5 then
    raise exception 'You can create at most 5 Pages' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists pages_creation_cap on public.pages;
create trigger pages_creation_cap before insert on public.pages
  for each row execute function public.enforce_page_creation_cap();

create or replace function public.page_grant_creator_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.page_admins (page_id, user_id, role) values (new.id, new.created_by_user_id, 'OWNER')
  on conflict (page_id, user_id) do update set role = 'OWNER';
  return new;
end $$;
drop trigger if exists pages_grant_owner on public.pages;
create trigger pages_grant_owner after insert on public.pages
  for each row execute function public.page_grant_creator_owner();

create or replace function public.page_follows_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.pages set followers_count = followers_count + 1 where id = new.page_id;
  else
    update public.pages set followers_count = greatest(followers_count - 1, 0) where id = old.page_id;
  end if;
  return null;
end $$;
drop trigger if exists page_follows_count on public.page_follows;
create trigger page_follows_count after insert or delete on public.page_follows
  for each row execute function public.page_follows_count();

-- Polymorphic post author. user_id stays the human who acted (audit);
-- author_type/author_id is the public identity.
alter table public.posts
  add column if not exists page_id uuid references public.pages(id) on delete cascade,
  add column if not exists author_type text not null default 'USER',
  add column if not exists author_id uuid;
do $$ begin
  alter table public.posts add constraint posts_author_type_check check (author_type in ('USER', 'PAGE'));
exception when duplicate_object then null; end $$;
update public.posts set author_id = user_id where author_id is null;
create index if not exists posts_page_idx on public.posts(page_id, created_at desc) where page_id is not null;

create or replace function public.posts_set_author() returns trigger
language plpgsql as $$
begin
  if new.page_id is null then
    new.author_type := 'USER';
    new.author_id := new.user_id;
  else
    new.author_type := 'PAGE';
    new.author_id := new.page_id;
  end if;
  return new;
end $$;
drop trigger if exists posts_set_author on public.posts;
create trigger posts_set_author before insert or update of page_id, user_id on public.posts
  for each row execute function public.posts_set_author();

create or replace function public.page_posts_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.page_id is not null then
    update public.pages set posts_count = posts_count + 1 where id = new.page_id;
  elsif tg_op = 'DELETE' and old.page_id is not null then
    update public.pages set posts_count = greatest(posts_count - 1, 0) where id = old.page_id;
  end if;
  return null;
end $$;
drop trigger if exists page_posts_count on public.posts;
create trigger page_posts_count after insert or delete on public.posts
  for each row execute function public.page_posts_count();

-- Reads are public; every write goes through the API with the service role
-- after the RBAC check.
alter table public.pages enable row level security;
alter table public.page_admins enable row level security;
alter table public.page_follows enable row level security;
drop policy if exists pages_read on public.pages;
create policy pages_read on public.pages for select using (true);
drop policy if exists page_admins_read on public.page_admins;
create policy page_admins_read on public.page_admins for select using (true);
drop policy if exists page_follows_read on public.page_follows;
create policy page_follows_read on public.page_follows for select using (true);
