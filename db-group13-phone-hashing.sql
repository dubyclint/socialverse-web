-- Group 13: phone hashing for contact discovery.
-- Raw phone numbers of a user's address book are never stored. The client
-- sends E.164 numbers over TLS, the server hashes them with a server-side
-- pepper and keeps only the digest, exactly like the WhatsApp/Snapchat
-- "find friends from contacts" flow.
-- Additive and re-runnable.

create extension if not exists pgcrypto;

-- The pepper lives in public.settings (service-role only) so that the digest
-- cannot be recomputed from a leaked contacts table alone.
insert into public.settings (scope, key, value)
values ('security', 'contact_hash_pepper',
        to_jsonb(encode(gen_random_bytes(32), 'hex')))
on conflict (scope, key) do nothing;

create or replace function public.hash_phone(p_e164 text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_pepper text;
  v_digits text;
begin
  if p_e164 is null then
    return null;
  end if;

  -- Normalise to digits with a leading '+': callers should already send
  -- E.164, this only guards against spacing and punctuation.
  v_digits := '+' || regexp_replace(p_e164, '[^0-9]', '', 'g');
  if length(v_digits) < 8 then
    return null;
  end if;

  select value #>> '{}' into v_pepper
    from public.settings
   where scope = 'security' and key = 'contact_hash_pepper';

  return encode(digest(coalesce(v_pepper, '') || v_digits, 'sha256'), 'hex');
end $$;

comment on function public.hash_phone(text) is
  'Peppered sha256 of an E.164 phone number, used for contact discovery.';

create or replace function public.hash_phones(p_e164 text[])
returns text[]
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(array_agg(public.hash_phone(phone) order by ord), '{}')
    from unnest(p_e164) with ordinality as t(phone, ord);
$$;

revoke all on function public.hash_phone(text) from public, anon;
revoke all on function public.hash_phones(text[]) from public, anon;
grant execute on function public.hash_phone(text) to service_role;
grant execute on function public.hash_phones(text[]) to service_role;

-- Keep public."user".phone_hash in step with the stored phone number so a
-- freshly registered account becomes discoverable to everyone who already
-- has that number saved.
create or replace function public.user_sync_phone_hash()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  new.phone_hash := public.hash_phone(new.phone);
  return new;
end $$;

drop trigger if exists user_phone_hash_sync on public."user";
create trigger user_phone_hash_sync
  before insert or update of phone on public."user"
  for each row execute function public.user_sync_phone_hash();

-- Backfill existing accounts that already have a phone number.
update public."user"
   set phone_hash = public.hash_phone(phone)
 where phone is not null
   and (phone_hash is null or phone_hash <> public.hash_phone(phone));

-- Re-resolve saved contacts whose owner has since registered.
update public.user_contacts c
   set contact_id = u.user_id,
       is_registered = true
  from public."user" u
 where c.phone_hash is not null
   and u.phone_hash = c.phone_hash
   and (c.contact_id is distinct from u.user_id or c.is_registered = false);
