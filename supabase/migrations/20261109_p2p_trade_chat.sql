-- Sutoi E: P2P trade chat kept apart from social chat, seller privacy flags.
create table if not exists public.p2p_trade_messages (
  id bigint generated always as identity primary key,
  trade_id uuid not null references public.p2p_trades(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('buyer', 'seller', 'staff')),
  body text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists p2p_trade_messages_trade_idx on public.p2p_trade_messages (trade_id, id);
alter table public.p2p_trade_messages enable row level security;
revoke all on public.p2p_trade_messages from anon, authenticated;

alter table public.seller_profiles add column if not exists show_username boolean not null default false;
alter table public.seller_profiles add column if not exists can_edit_payout_name boolean not null default false;
