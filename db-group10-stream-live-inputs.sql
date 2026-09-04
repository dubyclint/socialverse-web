-- Group 10: provider-backed live inputs for streams.
-- Cloudflare Stream (and any other WHIP/WHEP media server) issues per-stream
-- ingest and playback URLs; they are cached on the stream row so viewers never
-- trigger provider API calls.

alter table public.streams
  add column if not exists media_provider text not null default 'mesh',
  add column if not exists provider_input_id text,
  add column if not exists ingest_url text,
  add column if not exists playback_url text;

alter table public.streams
  drop constraint if exists streams_media_provider_check;

alter table public.streams
  add constraint streams_media_provider_check
  check (media_provider in ('mesh', 'whip', 'cloudflare'));

create index if not exists streams_provider_input_idx
  on public.streams (provider_input_id)
  where provider_input_id is not null;
