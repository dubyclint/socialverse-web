-- Likes, comments and PEW gifts on statuses.
create table if not exists public.status_likes (
  status_id uuid not null references public.user_statuses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (status_id, user_id)
);
create table if not exists public.status_comments (
  id uuid primary key default gen_random_uuid(),
  status_id uuid not null references public.user_statuses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists status_comments_status_idx on public.status_comments(status_id, created_at);
create table if not exists public.status_gifts (
  id uuid primary key default gen_random_uuid(),
  status_id uuid not null references public.user_statuses(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(18,4) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists status_gifts_status_idx on public.status_gifts(status_id);
alter table public.status_likes enable row level security;
alter table public.status_comments enable row level security;
alter table public.status_gifts enable row level security;
revoke all on public.status_likes, public.status_comments, public.status_gifts from anon, authenticated;
