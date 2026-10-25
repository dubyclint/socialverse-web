-- Text-only statuses carry no media.
alter table public.user_statuses alter column media_url drop not null;
