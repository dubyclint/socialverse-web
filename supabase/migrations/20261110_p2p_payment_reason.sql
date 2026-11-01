-- Reason for payment shown to the payer (defaults: 'Viorp top up' for deposits, 'Earnings/gifts withdrawal' for withdrawals).
alter table public.p2p_trades add column if not exists payment_reason text;
