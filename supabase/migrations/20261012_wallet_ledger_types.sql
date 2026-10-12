-- Runs before 20261013_wallet_fees.sql; ADD VALUE cannot share a transaction with its use.
alter type public.wallet_transaction_ledger_type add value if not exists 'GIFT_FEE';
alter type public.wallet_transaction_ledger_type add value if not exists 'WITHDRAWAL_REFUND';
alter type public.wallet_transaction_ledger_type add value if not exists 'DEPOSIT_FEE';
