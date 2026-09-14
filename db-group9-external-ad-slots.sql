-- External ad network fallback slots (AdSense, Meta, etc.)
-- Up to 3 active slots; selected per viewer by interest/behaviour match, then bid.

create table if not exists public.external_ad_slots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  provider text not null default 'adsense',
  client_id text not null,
  slot_id text not null,
  interest_ids uuid[] not null default '{}',
  bid_per_mille numeric(12,4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_ad_slots_provider_check
    check (provider in ('adsense', 'meta', 'taboola', 'outbrain', 'custom')),
  constraint external_ad_slots_bid_check check (bid_per_mille >= 0)
);

create unique index if not exists external_ad_slots_placement_key
  on public.external_ad_slots (provider, client_id, slot_id);

create or replace function public.enforce_external_ad_slot_cap()
returns trigger
language plpgsql
as $$
declare
  v_active integer;
begin
  if new.is_active then
    select count(*) into v_active
    from public.external_ad_slots
    where is_active and id <> new.id;

    if v_active >= 3 then
      raise exception 'At most 3 external ad slots can be active at once'
        using errcode = 'check_violation';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists external_ad_slots_cap on public.external_ad_slots;
create trigger external_ad_slots_cap
  before insert or update on public.external_ad_slots
  for each row execute function public.enforce_external_ad_slot_cap();

alter table public.external_ad_slots enable row level security;

drop policy if exists external_ad_slots_read on public.external_ad_slots;
create policy external_ad_slots_read on public.external_ad_slots
  for select using (is_active);

drop policy if exists external_ad_slots_admin on public.external_ad_slots;
create policy external_ad_slots_admin on public.external_ad_slots
  for all using (
    exists (
      select 1 from public."user" u
      where u.user_id = auth.uid()
        and u.role in ('admin', 'manager')
    )
  );

grant select on public.external_ad_slots to anon, authenticated;
grant all on public.external_ad_slots to service_role;
