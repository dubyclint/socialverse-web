-- Personal info fields with per-field visibility, profile lock and online-presence opt-out.
alter table public."user"
  add column if not exists marital_status text,
  add column if not exists university text,
  add column if not exists work text,
  add column if not exists religion text,
  add column if not exists profile_locked boolean not null default false,
  add column if not exists show_online boolean not null default true,
  add column if not exists field_visibility jsonb not null default '{}'::jsonb;

comment on column public."user".field_visibility is
  'Per-field public flag, e.g. {"university": false}. Missing keys are public.';
comment on column public."user".profile_locked is
  'When true, non-PAL viewers only see basic info (name, username, avatar, bio, counts).';
comment on column public."user".show_online is
  'When false, other users never see this user as online or their last-seen time.';
