create table if not exists public.user_mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists user_mfa_recovery_codes_user_idx on public.user_mfa_recovery_codes(user_id);
alter table public.user_mfa_recovery_codes enable row level security;
revoke all on public.user_mfa_recovery_codes from anon, authenticated;
