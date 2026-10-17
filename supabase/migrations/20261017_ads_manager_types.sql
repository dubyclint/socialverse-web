-- Enum values must commit before functions in the next migration reference them.
alter type public.wallet_transaction_ledger_type add value if not exists 'AD_BUDGET_HOLD';
alter type public.wallet_transaction_ledger_type add value if not exists 'AD_BUDGET_REFUND';
alter type public.ad_campaign_lifecycle_status add value if not exists 'REJECTED';
alter type public.ad_campaign_lifecycle_status add value if not exists 'ARCHIVED';
alter type public.ad_action_type add value if not exists 'LEAD';
alter type public.ad_action_type add value if not exists 'MESSAGE';
alter type public.ad_action_type add value if not exists 'CONVERSION';
