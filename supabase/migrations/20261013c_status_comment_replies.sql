-- Threaded status comments: the status author can reply to a comment.
alter table public.status_comments add column if not exists reply_to uuid references public.status_comments(id) on delete cascade;
create index if not exists status_comments_reply_idx on public.status_comments(reply_to);
