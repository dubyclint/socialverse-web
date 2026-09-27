-- Additive: per-provider admin-set deposit fees, limits and platform availability.
alter table public.payment_providers
  add column if not exists fee_percent numeric(6,4) not null default 0,
  add column if not exists fee_flat numeric(20,4) not null default 0,
  add column if not exists min_amount numeric(20,4),
  add column if not exists max_amount numeric(20,4),
  add column if not exists sort_order integer not null default 100,
  add column if not exists web_only boolean not null default true;

comment on column public.payment_providers.fee_percent is 'Admin-set percentage fee charged on top of the deposit amount at payment time.';
comment on column public.payment_providers.fee_flat is 'Admin-set flat fee (source currency) charged on top of the deposit amount at payment time.';
comment on column public.payment_providers.min_amount is 'Provider-specific minimum deposit; falls back to deposit_settings when null.';
comment on column public.payment_providers.max_amount is 'Provider-specific maximum deposit; falls back to deposit_settings when null.';
comment on column public.payment_providers.web_only is 'Top-ups are web-only by default so native store builds stay compliant.';

-- Flutterwave manual bank/currency slots and payment links live in provider config.
insert into public.payment_providers (code, display_name, route, is_enabled, supported_currencies, config, sort_order)
values
  ('paystack', 'Paystack', 'PSP', false, array['NGN', 'USD', 'GHS', 'ZAR', 'KES'], '{}'::jsonb, 10),
  ('flutterwave', 'Flutterwave', 'PSP', false, array['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES'], '{"bank_slots": [], "payment_links": []}'::jsonb, 20),
  ('nowpayments', 'Crypto (NOWPayments)', 'CRYPTO', false, array['USD', 'EUR', 'NGN'], '{}'::jsonb, 30)
on conflict (code) do nothing;

-- Provider-reported payment identity for webhook reconciliation.
create unique index if not exists deposits_external_ref_key
  on public.deposits (provider_code, external_ref)
  where external_ref is not null;
