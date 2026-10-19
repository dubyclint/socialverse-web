-- Go-live access: 15-minute lifetime trial, qualification rules, admin overrides,
-- server-enforced trial deadline, and 80/20 split for gifts to viewers inside a stream.

create table if not exists public.live_access_rules (
  id boolean primary key default true check (id),
  trial_minutes integer not null default 15,
  min_followers integer not null default 10000,
  min_account_days integer not null default 90,
  min_pew_added numeric not null default 1000,
  min_pew_received numeric not null default 5000,
  min_active_days integer not null default 30,
  min_transactions integer not null default 10,
  window_days integer not null default 90,
  updated_at timestamptz not null default now()
);
insert into public.live_access_rules (id) values (true) on conflict do nothing;

create table if not exists public.live_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  override text not null default 'auto' check (override in ('auto', 'granted', 'denied')),
  trial_reset_at timestamptz,
  note text,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.live_access_rules enable row level security;
alter table public.live_access enable row level security;
drop policy if exists live_access_rules_read on public.live_access_rules;
create policy live_access_rules_read on public.live_access_rules for select using (true);
drop policy if exists live_access_own on public.live_access;
create policy live_access_own on public.live_access for select using (user_id = auth.uid());

alter table public.streams add column if not exists access_mode text;
alter table public.streams add column if not exists trial_deadline timestamptz;

create or replace function public.live_eligibility(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  r public.live_access_rules;
  v_override text := 'auto';
  v_reset timestamptz;
  v_since timestamptz;
  v_account_days integer;
  v_followers integer;
  v_added numeric;
  v_received numeric;
  v_active_days integer;
  v_tx integer;
  v_trial_used integer;
  v_trial_left integer;
  v_qualified boolean;
  v_mode text;
begin
  select * into r from public.live_access_rules where id;
  select override, trial_reset_at into v_override, v_reset from public.live_access where user_id = p_user;
  v_override := coalesce(v_override, 'auto');
  v_since := now() - make_interval(days => r.window_days);

  select greatest(0, extract(day from now() - coalesce(u.created_at, now()))::int) into v_account_days
    from public."user" u where u.user_id = p_user;

  select count(*) into v_followers
    from public.follows f join public."user" u on u.user_id = f.follower_id
   where f.following_id = p_user and coalesce(u.is_banned, false) = false;

  select coalesce(sum(credited_pewgift), 0) into v_added
    from public.deposits where user_id = p_user and status = 'SETTLED';

  select coalesce(sum(amount), 0) into v_received
    from public.wallet_ledger
   where wallet_id = p_user and amount > 0
     and transaction_type in ('GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED');

  select count(distinct d) into v_active_days from (
    select created_at::date d from public.posts where user_id = p_user and created_at >= v_since
    union
    select created_at::date from public.comments where user_id = p_user and created_at >= v_since
    union
    select created_at::date from public.chat_messages where sender_id = p_user and created_at >= v_since
  ) a;

  select count(*) into v_tx from public.wallet_ledger where wallet_id = p_user and created_at >= v_since;

  select coalesce(sum(extract(epoch from (least(coalesce(s.ended_at, now()), coalesce(s.trial_deadline, now())) - s.started_at))), 0)::int
    into v_trial_used
    from public.streams s
   where s.creator_id = p_user and s.access_mode = 'trial' and s.started_at is not null
     and (v_reset is null or s.started_at >= v_reset);
  v_trial_left := greatest(0, r.trial_minutes * 60 - greatest(0, v_trial_used));

  v_qualified := coalesce(v_account_days, 0) >= r.min_account_days
    and v_followers >= r.min_followers
    and (v_added >= r.min_pew_added or v_received >= r.min_pew_received)
    and v_active_days >= r.min_active_days
    and v_tx >= r.min_transactions;

  v_mode := case
    when v_override = 'denied' then 'denied'
    when v_override = 'granted' then 'waived'
    when v_qualified then 'qualified'
    when v_trial_left > 0 then 'trial'
    else 'locked'
  end;

  return jsonb_build_object(
    'mode', v_mode,
    'canGoLive', v_mode in ('waived', 'qualified', 'trial'),
    'override', v_override,
    'trialSecondsLeft', v_trial_left,
    'trialSecondsTotal', r.trial_minutes * 60,
    'qualified', v_qualified,
    'progress', jsonb_build_object(
      'accountDays', coalesce(v_account_days, 0),
      'followers', v_followers,
      'pewAdded', v_added,
      'pewReceived', v_received,
      'activeDays', v_active_days,
      'transactions', v_tx
    ),
    'rules', to_jsonb(r) - 'id' - 'updated_at'
  );
end $$;

revoke all on function public.live_eligibility(uuid) from public, anon, authenticated;
grant execute on function public.live_eligibility(uuid) to service_role;

-- Gift inside a live stream. Gifts to the host go fully to the host; gifts to another
-- participant are split 80% host / 20% participant (each leg pays the normal gift fee).
create or replace function public.send_stream_gift(p_stream_id uuid, p_recipient_id uuid, p_gift_id uuid, p_quantity integer default 1, p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sender uuid := auth.uid();
  v_host uuid;
  v_status text;
  v_cost numeric;
  v_active boolean;
  v_total numeric;
  v_host_share numeric;
  v_balance numeric;
  v_tx uuid;
  v_ctx jsonb;
begin
  if v_sender is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100 then
    raise exception 'quantity must be between 1 and 100' using errcode = '22023';
  end if;
  if p_recipient_id = v_sender then
    raise exception 'You cannot gift yourself' using errcode = '22023';
  end if;

  select creator_id, broadcast_status into v_host, v_status from public.streams where id = p_stream_id;
  if v_host is null then
    raise exception 'stream not found' using errcode = 'P0002';
  end if;
  if v_status <> 'LIVE' then
    raise exception 'This stream is not live' using errcode = '22023';
  end if;

  select cost_credits, is_active into v_cost, v_active from public.gift_catalog where id = p_gift_id;
  if v_cost is null then
    raise exception 'gift not found' using errcode = 'P0002';
  end if;
  if not v_active then
    raise exception 'gift is not available' using errcode = '22023';
  end if;
  v_total := v_cost * p_quantity;
  v_ctx := jsonb_build_object('stream_id', p_stream_id, 'message', p_message);

  if p_recipient_id = v_host or v_sender = v_host then
    v_balance := public.transfer_pewgift(v_sender, p_recipient_id, v_total, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM', p_gift_id, v_ctx || jsonb_build_object('share', 'full'));
  else
    if not exists (select 1 from public.stream_viewers where stream_id = p_stream_id and viewer_id = p_recipient_id)
       and not exists (select 1 from public.stream_chats where stream_id = p_stream_id and user_id = p_recipient_id) then
      raise exception 'That person is not in this live stream' using errcode = '22023';
    end if;
    v_host_share := round(v_total * 0.8, 4);
    perform public.transfer_pewgift(v_sender, v_host, v_host_share, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM', p_gift_id, v_ctx || jsonb_build_object('share', 'host_80', 'gifted_user', p_recipient_id));
    v_balance := public.transfer_pewgift(v_sender, p_recipient_id, v_total - v_host_share, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM', p_gift_id, v_ctx || jsonb_build_object('share', 'participant_20', 'host', v_host));
  end if;

  insert into public.gift_transactions (gift_id, sender_id, recipient_id, credit_value, stream_id)
  values (p_gift_id, v_sender, p_recipient_id, v_total, p_stream_id)
  returning id into v_tx;

  return jsonb_build_object('transaction_id', v_tx, 'total_cost', v_total, 'new_sender_balance', v_balance,
    'host_id', v_host, 'split', p_recipient_id <> v_host and v_sender <> v_host);
end $$;

revoke all on function public.send_stream_gift(uuid, uuid, uuid, integer, text) from public, anon;
grant execute on function public.send_stream_gift(uuid, uuid, uuid, integer, text) to authenticated;
