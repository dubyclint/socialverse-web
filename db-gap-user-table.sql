-- Additive migration: bring the live `user` table in line with what the app reads/writes.
-- Safe to re-run (IF NOT EXISTS on every column). No data is dropped or rewritten.
--
-- Why: server/api/profile/me.get.ts selects these columns and server/api/profile/complete.post.ts
-- writes `profile_completed`. They don't exist in the live project, so /api/profile/me returns 500,
-- the profile store stays empty, and middleware/profile-completion.ts redirects every authenticated
-- route to /profile/complete — which then also fails.

alter table public."user" add column if not exists email            text;
alter table public."user" add column if not exists full_name        text;
alter table public."user" add column if not exists cover_url        text;
alter table public."user" add column if not exists website          text;
alter table public."user" add column if not exists birth_date       date;
alter table public."user" add column if not exists gender           text;
alter table public."user" add column if not exists phone            text;
alter table public."user" add column if not exists profile_completed boolean not null default false;
alter table public."user" add column if not exists is_private       boolean not null default false;
alter table public."user" add column if not exists rank             text;
alter table public."user" add column if not exists rank_points      integer not null default 0;
alter table public."user" add column if not exists rank_level       integer not null default 0;
alter table public."user" add column if not exists followers_count  integer not null default 0;
alter table public."user" add column if not exists following_count  integer not null default 0;
alter table public."user" add column if not exists posts_count      integer not null default 0;
alter table public."user" add column if not exists last_seen        timestamptz;
