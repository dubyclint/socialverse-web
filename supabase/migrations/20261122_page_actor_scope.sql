-- A Page acts as its own account: its statuses and notifications belong to the Page.
alter table public.user_statuses add column if not exists page_id uuid references public.pages(id) on delete cascade;
create index if not exists user_statuses_page_idx on public.user_statuses(page_id) where deleted_at is null;

alter table public.notifications add column if not exists recipient_page_id uuid references public.pages(id) on delete cascade;
create index if not exists notifications_page_idx on public.notifications(recipient_page_id, created_at desc) where recipient_page_id is not null;
