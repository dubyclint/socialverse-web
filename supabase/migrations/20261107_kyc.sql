-- KYC (private identity verification), manual or via Didit. Separate from public badges.
create table if not exists public.user_kyc (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'none' check (status in ('none', 'pending', 'verified', 'rejected', 'revoked')),
  legal_name text,
  method text check (method in ('manual', 'didit', 'assigned')),
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.user_kyc enable row level security;
drop policy if exists user_kyc_self on public.user_kyc;
create policy user_kyc_self on public.user_kyc for select using (auth.uid() = user_id);
revoke insert, update, delete on public.user_kyc from anon, authenticated;

create table if not exists public.kyc_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('manual', 'didit')),
  status text not null default 'pending' check (status in ('pending', 'in_review', 'approved', 'rejected', 'abandoned')),
  full_name text not null,
  id_type text,
  id_number text,
  residence text,
  signature text,
  signed_on date,
  sentence text,
  sentence_photo_path text,
  pay_later boolean not null default false,
  didit_session_id text unique,
  decision jsonb,
  fee_pew numeric,
  fee_paid numeric not null default 0,
  review_note text,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kyc_requests_user_idx on public.kyc_requests (user_id, created_at desc);
create index if not exists kyc_requests_status_idx on public.kyc_requests (status, created_at);
alter table public.kyc_requests enable row level security;
revoke all on public.kyc_requests from anon, authenticated;

create table if not exists public.didit_webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);
alter table public.didit_webhook_events enable row level security;
revoke all on public.didit_webhook_events from anon, authenticated;

-- PEW owed (KYC "pay later"); settled first from any later credit.
alter table public.wallets add column if not exists pew_debt numeric not null default 0;
alter table public.wallets drop constraint if exists wallets_pew_debt_check;
alter table public.wallets add constraint wallets_pew_debt_check check (pew_debt >= 0);

create or replace function public.settle_pew_debt() returns trigger language plpgsql as $$
declare v_settle numeric;
begin
  if new.pew_debt > 0 and new.balance > coalesce(old.balance, 0) then
    v_settle := least(new.balance - coalesce(old.balance, 0), new.pew_debt);
    new.balance := new.balance - v_settle;
    new.pew_debt := new.pew_debt - v_settle;
    new.withdrawable_balance := least(new.withdrawable_balance, new.balance);
  end if;
  return new;
end $$;
drop trigger if exists wallets_settle_debt on public.wallets;
create trigger wallets_settle_debt before update of balance on public.wallets
  for each row execute function public.settle_pew_debt();

-- Approve a KYC request and charge the fee: from balance, or as debt when the user chose pay-later.
create or replace function public.kyc_approve(p_request uuid, p_reviewer uuid, p_waive boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r kyc_requests%rowtype; w wallets%rowtype; v_fee numeric; v_paid numeric := 0; v_debt numeric := 0;
begin
  select * into r from kyc_requests where id = p_request for update;
  if not found then raise exception 'Request not found' using errcode = 'P0002'; end if;
  if r.status = 'approved' then raise exception 'Already approved' using errcode = '23505'; end if;
  v_fee := case when p_waive then 0 else coalesce(r.fee_pew, 1.4) end;
  if v_fee > 0 then
    select * into w from wallets where user_id = r.user_id and currency = 'PEW' for update;
    if coalesce(w.balance, 0) >= v_fee then
      v_paid := v_fee;
    elsif r.pay_later and w.user_id is not null then
      v_paid := coalesce(w.balance, 0); v_debt := v_fee - v_paid;
    else
      raise exception 'Low PEW balance: KYC costs % PEW', v_fee using errcode = '23514';
    end if;
    update wallets set balance = balance - v_paid,
                       withdrawable_balance = least(withdrawable_balance, balance - v_paid),
                       pew_debt = pew_debt + v_debt, updated_at = now()
     where user_id = r.user_id and currency = 'PEW';
    if v_paid > 0 then
      insert into transactions (user_id, amount, type, description, icon, metadata)
      values (r.user_id, v_paid, 'debit', 'KYC verification fee', 'shield', jsonb_build_object('kyc_request', r.id, 'debt', v_debt));
    end if;
  end if;
  update kyc_requests set status = 'approved', fee_paid = v_paid, reviewed_by = p_reviewer, updated_at = now() where id = r.id;
  insert into user_kyc (user_id, status, legal_name, method, verified_at, updated_at)
  values (r.user_id, 'verified', r.full_name, r.method, now(), now())
  on conflict (user_id) do update set status = 'verified', legal_name = excluded.legal_name, method = excluded.method, verified_at = now(), updated_at = now();
  return jsonb_build_object('fee', v_fee, 'paid', v_paid, 'debt', v_debt);
end $$;
revoke all on function public.kyc_approve(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.settle_pew_debt() from public, anon, authenticated;
