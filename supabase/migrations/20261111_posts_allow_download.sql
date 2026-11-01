-- Creator control: allow viewers to download a post's media (Veep download button).
alter table public.posts add column if not exists allow_download boolean not null default true;
