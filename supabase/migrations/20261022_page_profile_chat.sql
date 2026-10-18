-- Pages behave like full profiles: contact/about details and their own inbox.
alter table public.pages
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists location text,
  add column if not exists founded_year integer check (founded_year is null or founded_year between 1800 and 2100);

-- A Page conversation is a direct room between one visitor and the Page.
-- Every OWNER/MANAGER of the Page is a member and replies as the Page.
alter table public.chat_rooms
  add column if not exists page_id uuid references public.pages(id) on delete cascade,
  add column if not exists page_visitor_id uuid;

create unique index if not exists chat_rooms_page_visitor_uniq
  on public.chat_rooms (page_id, page_visitor_id)
  where page_id is not null;
