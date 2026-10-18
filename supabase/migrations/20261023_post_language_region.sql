-- Feed matching signals: content language (ISO 639-1) and author region (ISO 3166-1 alpha-2).
alter table public.posts
  add column if not exists language text check (language is null or language ~ '^[a-z]{2}$'),
  add column if not exists country text check (country is null or country ~ '^[A-Z]{2}$');

create index if not exists posts_language_created_idx on public.posts (language, created_at desc);
create index if not exists posts_country_created_idx on public.posts (country, created_at desc);
