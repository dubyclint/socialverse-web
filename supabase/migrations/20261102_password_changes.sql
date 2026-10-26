-- Password change history; the app allows one change per user per 30 days.
create table if not exists public.password_changes (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('requested', 'changed')),
  created_at timestamptz not null default now()
);
create index if not exists password_changes_user_idx on public.password_changes (user_id, kind, created_at desc);
alter table public.password_changes enable row level security;
revoke all on public.password_changes from anon, authenticated;
