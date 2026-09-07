-- Group 1 (repoints): columns the already-shipped admin, rank and notification
-- flows read from `public."user"` but that do not exist in the live schema.
--
--   1. moderation state   — /api/admin (ban/unban) and admin-controller.
--   2. verification stamp — /api/admin verify + /api/verified/approve.
--   3. rank visibility    — /api/rank/toggle.
--   4. push token         — server/utils/send-push-alert + admin-controller.
--
-- Purely additive. Safe to re-run.

alter table public."user" add column if not exists is_banned           boolean     not null default false;
alter table public."user" add column if not exists ban_reason          text;
alter table public."user" add column if not exists banned_at           timestamptz;
alter table public."user" add column if not exists verified_at         timestamptz;
alter table public."user" add column if not exists hide_rank           boolean     not null default false;
alter table public."user" add column if not exists can_toggle_rank     boolean     not null default false;
alter table public."user" add column if not exists rank_toggle_expires timestamptz;
alter table public."user" add column if not exists push_token          text;

create index if not exists user_is_banned_idx on public."user" (is_banned) where is_banned;
