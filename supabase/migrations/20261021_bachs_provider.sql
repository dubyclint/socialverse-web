-- Bachs hosted checkout as an Add Funds option; Flutterwave enabled (shown only when its keys are present at runtime).
insert into public.payment_providers (code, display_name, route, is_enabled, supported_currencies, config, fee_percent, fee_flat, sort_order, web_only)
values ('bachs', 'Bachs (card, bank transfer, mobile money)', 'PSP', true, '{USD,NGN,GHS,KES}', '{}'::jsonb, 0, 0, 15, true)
on conflict (code) do update set is_enabled = true, display_name = excluded.display_name;
update public.payment_providers set is_enabled = true where code = 'flutterwave';
