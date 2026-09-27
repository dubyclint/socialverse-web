-- Phone numbers are stored in whatever shape the signup form received them
-- ("08031234567", "+15551234567"), while contact sync hashes E.164 numbers
-- coming from the address book. The two digests never matched, so contact
-- discovery resolved zero registered accounts.
--
-- This migration canonicalises stored numbers to E.164 before hashing.
-- Additive and re-runnable.

alter table public."user"
  add column if not exists phone_country text;

comment on column public."user".phone_country is
  'ISO-3166-1 alpha-2 country of the account phone number, used to expand a national number to E.164.';

-- Country calling codes used to expand a national number. Mirrors
-- server/utils/phone.ts so client and database agree on the canonical form.
create or replace function public.phone_calling_code(p_country text)
returns text
language sql
immutable
as $$
  select case upper(coalesce(p_country, ''))
    when 'US' then '1'   when 'CA' then '1'   when 'GB' then '44'  when 'IE' then '353'
    when 'NG' then '234' when 'GH' then '233' when 'KE' then '254' when 'ZA' then '27'
    when 'IN' then '91'  when 'PK' then '92'  when 'BD' then '880' when 'PH' then '63'
    when 'ID' then '62'  when 'MY' then '60'  when 'SG' then '65'  when 'AU' then '61'
    when 'NZ' then '64'  when 'DE' then '49'  when 'FR' then '33'  when 'ES' then '34'
    when 'IT' then '39'  when 'NL' then '31'  when 'BE' then '32'  when 'PT' then '351'
    when 'SE' then '46'  when 'NO' then '47'  when 'DK' then '45'  when 'FI' then '358'
    when 'PL' then '48'  when 'UA' then '380' when 'TR' then '90'  when 'RU' then '7'
    when 'BR' then '55'  when 'MX' then '52'  when 'AR' then '54'  when 'CL' then '56'
    when 'CO' then '57'  when 'PE' then '51'  when 'EG' then '20'  when 'MA' then '212'
    when 'SA' then '966' when 'AE' then '971' when 'QA' then '974' when 'JP' then '81'
    when 'KR' then '82'  when 'CN' then '86'  when 'TH' then '66'  when 'VN' then '84'
    else null
  end;
$$;

create or replace function public.normalise_e164(p_raw text, p_country text default null)
returns text
language plpgsql
immutable
as $$
declare
  v_digits text;
  v_code   text;
  v_national text;
begin
  if p_raw is null or btrim(p_raw) = '' then
    return null;
  end if;

  v_digits := regexp_replace(p_raw, '[^0-9]', '', 'g');
  if v_digits = '' then
    return null;
  end if;

  if btrim(p_raw) like '+%' then
    null; -- already international
  elsif v_digits like '00%' then
    v_digits := substr(v_digits, 3);
  else
    v_code := public.phone_calling_code(p_country);
    if v_code is not null then
      v_national := case when left(v_digits, 1) = '0' then substr(v_digits, 2) else v_digits end;
      if left(v_national, length(v_code)) = v_code and length(v_national) > length(v_code) + 6 then
        v_digits := v_national;
      else
        v_digits := v_code || v_national;
      end if;
    elsif length(v_digits) < 11 then
      return null; -- no country context and too short to be international
    end if;
  end if;

  if length(v_digits) < 8 or length(v_digits) > 15 then
    return null;
  end if;

  return '+' || v_digits;
end $$;

comment on function public.normalise_e164(text, text) is
  'Expands a phone number to E.164 using an optional ISO-3166-1 alpha-2 country.';

-- The trigger now canonicalises the stored number first, so the account digest
-- is computed over the same E.164 string an address-book entry produces.
create or replace function public.user_sync_phone_hash()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_e164 text;
begin
  v_e164 := public.normalise_e164(new.phone, new.phone_country);
  if v_e164 is not null then
    new.phone := v_e164;
  end if;
  new.phone_hash := public.hash_phone(new.phone);
  return new;
end $$;

drop trigger if exists user_phone_hash_sync on public."user";
create trigger user_phone_hash_sync
  before insert or update of phone, phone_country on public."user"
  for each row execute function public.user_sync_phone_hash();

-- Backfill: international numbers first, then Nigerian mobile numbers, which
-- are unambiguous in their national form (0 followed by 7/8/9 and 9 digits).
update public."user"
   set phone_country = coalesce(phone_country, 'NG')
 where phone ~ '^0[789][0-9]{9}$';

update public."user"
   set phone = public.normalise_e164(phone, phone_country)
 where phone is not null
   and public.normalise_e164(phone, phone_country) is not null
   and public.normalise_e164(phone, phone_country) <> phone;

update public."user"
   set phone_hash = public.hash_phone(phone)
 where phone is not null
   and phone_hash is distinct from public.hash_phone(phone);

-- Re-resolve saved contacts whose owner is now discoverable.
update public.user_contacts c
   set contact_id = u.user_id,
       is_registered = true
  from public."user" u
 where c.phone_hash is not null
   and u.phone_hash = c.phone_hash
   and (c.contact_id is distinct from u.user_id or c.is_registered = false);
