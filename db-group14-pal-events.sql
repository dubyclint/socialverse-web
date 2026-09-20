-- Group 14: notification events for the friend (PAL) lifecycle.
-- Additive and re-runnable.

alter type public.notification_event_type add value if not exists 'PAL_REQUEST';
alter type public.notification_event_type add value if not exists 'PAL_ACCEPTED';
