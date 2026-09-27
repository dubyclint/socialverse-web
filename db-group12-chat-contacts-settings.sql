-- Group 12: phone-contact sync (WhatsApp/Snapchat model), chat capabilities
-- and per-user private settings.
-- Additive and re-runnable: no drops of tables, columns or data.

-- ---------------------------------------------------------------------------
-- 1. Contact sync
-- Phones are never stored in clear: the client normalises to E.164 and sends
-- sha256(e164 + server pepper). A contact becomes "registered" when its hash
-- matches public."user".phone_hash.
-- ---------------------------------------------------------------------------
alter table public.user_contacts
  add column if not exists is_registered boolean not null default false,
  add column if not exists synced_at timestamptz not null default now(),
  add column if not exists source text not null default 'phonebook',
  add column if not exists is_favourite boolean not null default false;

create unique index if not exists user_contacts_user_phone_hash_uidx
  on public.user_contacts (user_id, phone_hash)
  where phone_hash is not null;

create index if not exists user_contacts_phone_hash_idx
  on public.user_contacts (phone_hash);

create index if not exists user_contacts_contact_idx
  on public.user_contacts (contact_id);

create index if not exists user_phone_hash_idx
  on public."user" (phone_hash)
  where phone_hash is not null;

alter table public.user_contacts enable row level security;

drop policy if exists user_contacts_owner_select on public.user_contacts;
create policy user_contacts_owner_select on public.user_contacts
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_contacts_owner_write on public.user_contacts;
create policy user_contacts_owner_write on public.user_contacts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_contacts_owner_update on public.user_contacts;
create policy user_contacts_owner_update on public.user_contacts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_contacts_owner_delete on public.user_contacts;
create policy user_contacts_owner_delete on public.user_contacts
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Chat capabilities: replies, edits, deletes, disappearing messages,
-- group admin roles, per-member mute/pin/archive.
-- ---------------------------------------------------------------------------
alter table public.chat_rooms
  add column if not exists last_message_at timestamptz,
  add column if not exists disappearing_seconds integer;

alter table public.chat_room_members
  add column if not exists member_role text not null default 'member',
  add column if not exists muted_until timestamptz,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_archived boolean not null default false;

alter table public.chat_messages
  add column if not exists reply_to_id uuid,
  add column if not exists message_type text not null default 'text',
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_for_everyone boolean not null default false,
  add column if not exists expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chat_messages_reply_to_fk'
  ) then
    alter table public.chat_messages
      add constraint chat_messages_reply_to_fk
      foreign key (reply_to_id) references public.chat_messages (id)
      on delete set null;
  end if;
end $$;

create index if not exists chat_messages_reply_to_idx
  on public.chat_messages (reply_to_id);

create index if not exists chat_messages_expires_idx
  on public.chat_messages (expires_at)
  where expires_at is not null;

create index if not exists chat_rooms_last_message_idx
  on public.chat_rooms (last_message_at desc nulls last);

-- Keep the room ordering watermark current for chat-list sorting.
create or replace function public.chat_rooms_touch_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_rooms
     set last_message_at = new.created_at,
         updated_at = now()
   where id = new.room_id;
  return new;
end $$;

drop trigger if exists chat_messages_touch_room on public.chat_messages;
create trigger chat_messages_touch_room
  after insert on public.chat_messages
  for each row execute function public.chat_rooms_touch_last_message();

-- ---------------------------------------------------------------------------
-- 3. Per-user private settings (account, privacy, notifications,
-- storage & data, general). Readable and writable only by the owner.
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references public."user" (user_id) on delete cascade,
  account jsonb not null default '{}'::jsonb,
  privacy jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  storage_data jsonb not null default '{}'::jsonb,
  general jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is
  'Private per-user preferences grouped by settings screen section.';

alter table public.user_settings enable row level security;

drop policy if exists user_settings_owner_select on public.user_settings;
create policy user_settings_owner_select on public.user_settings
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_settings_owner_insert on public.user_settings;
create policy user_settings_owner_insert on public.user_settings
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_settings_owner_update on public.user_settings;
create policy user_settings_owner_update on public.user_settings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Friend graph lookups used by requests, suggestions and block checks.
-- ---------------------------------------------------------------------------
create index if not exists pals_user_status_idx on public.pals (user_id, status);
create index if not exists pals_pal_status_idx on public.pals (pal_id, status);
create unique index if not exists pals_pair_uidx on public.pals (user_id, pal_id);
create index if not exists user_blocks_blocker_idx on public.user_blocks (blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);
