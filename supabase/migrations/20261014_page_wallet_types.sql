alter type public.wallet_transaction_ledger_type add value if not exists 'PAGE_TRANSFER_OUT';
alter type public.wallet_transaction_ledger_type add value if not exists 'PAGE_TRANSFER_IN';
alter type public.wallet_transaction_ledger_type add value if not exists 'PAGE_PAYOUT';
