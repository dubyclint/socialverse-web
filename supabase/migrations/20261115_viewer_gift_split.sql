-- Admin-adjustable host share for gifts sent to viewers/guests inside a LIVE (was fixed 80/20).
alter table public.live_access_rules add column if not exists viewer_gift_host_pct numeric not null default 80
  check (viewer_gift_host_pct >= 0 and viewer_gift_host_pct <= 100);

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
  v_pct numeric;
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
  select coalesce((select viewer_gift_host_pct from public.live_access_rules where id = true), 80) into v_pct;

  if p_recipient_id = v_host or v_sender = v_host then
    v_balance := public.transfer_pewgift(v_sender, p_recipient_id, v_total, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM', p_gift_id, v_ctx || jsonb_build_object('share', 'full'));
  else
    if not exists (select 1 from public.stream_viewers where stream_id = p_stream_id and viewer_id = p_recipient_id)
       and not exists (select 1 from public.stream_chats where stream_id = p_stream_id and user_id = p_recipient_id) then
      raise exception 'That person is not in this live stream' using errcode = '22023';
    end if;
    v_host_share := round(v_total * v_pct / 100, 4);
    if v_host_share > 0 then
      perform public.transfer_pewgift(v_sender, v_host, v_host_share, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM', p_gift_id, v_ctx || jsonb_build_object('share', 'host', 'host_pct', v_pct, 'gifted_user', p_recipient_id));
    end if;
    if v_total - v_host_share > 0 then
      v_balance := public.transfer_pewgift(v_sender, p_recipient_id, v_total - v_host_share, 'GIFT_PURCHASE', 'GIFT_RECOVERY_REDEEM', p_gift_id, v_ctx || jsonb_build_object('share', 'participant', 'host_pct', v_pct, 'host', v_host));
    else
      select balance into v_balance from public.wallets where user_id = v_sender;
    end if;
  end if;

  insert into public.gift_transactions (gift_id, sender_id, recipient_id, credit_value, stream_id)
  values (p_gift_id, v_sender, p_recipient_id, v_total, p_stream_id)
  returning id into v_tx;

  return jsonb_build_object('transaction_id', v_tx, 'total_cost', v_total, 'new_sender_balance', v_balance,
    'host_id', v_host, 'split', p_recipient_id <> v_host and v_sender <> v_host, 'host_pct', v_pct);
end $$;

revoke all on function public.send_stream_gift(uuid, uuid, uuid, integer, text) from public, anon;
grant execute on function public.send_stream_gift(uuid, uuid, uuid, integer, text) to authenticated;
