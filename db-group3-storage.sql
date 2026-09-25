-- Group 3: storage buckets, per-user object policies and upload accounting.
-- Additive and rerunnable. The project had no buckets at all, so every avatar,
-- post-media and stream-recording upload failed at runtime.

-- ---------------------------------------------------------------------------
-- Buckets. Limits and MIME lists mirror STORAGE_CONFIG in server/utils/storage.ts
-- so the client-side check and the storage service agree.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',      'avatars',      true,    5 * 1024 * 1024, array['image/jpeg','image/png','image/gif','image/webp']),
  ('posts',        'posts',        true,   50 * 1024 * 1024, array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm']),
  ('chat-media',   'chat-media',   false,  25 * 1024 * 1024, array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/ogg']),
  ('streams',      'streams',      true,  150 * 1024 * 1024, array['video/mp4','video/webm']),
  ('gifts',        'gifts',        true,    5 * 1024 * 1024, array['image/jpeg','image/png','image/webp','application/json']),
  ('ads',          'ads',          true,  100 * 1024 * 1024, array['image/jpeg','image/png','video/mp4']),
  ('moderation',   'moderation',   false,  10 * 1024 * 1024, array['image/jpeg','image/png']),
  ('temp-uploads', 'temp-uploads', false,  20 * 1024 * 1024, array['image/jpeg','image/png','video/mp4']),
  ('uploads',      'uploads',      true,   50 * 1024 * 1024, array['image/jpeg','image/png','video/mp4'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Object policies. Every write path is scoped to a folder named after the
-- uploader's uid, so `avatars/<uid>/file.jpg` is the only shape a user can write.
-- ---------------------------------------------------------------------------
do $$
declare
  b text;
  public_buckets text[] := array['avatars', 'posts', 'streams', 'gifts', 'ads', 'uploads'];
  all_buckets    text[] := array['avatars', 'posts', 'chat-media', 'streams', 'gifts', 'ads', 'moderation', 'temp-uploads', 'uploads'];
begin
  foreach b in array all_buckets loop
    execute format('drop policy if exists %I on storage.objects', b || '_owner_write');
    execute format('drop policy if exists %I on storage.objects', b || '_owner_update');
    execute format('drop policy if exists %I on storage.objects', b || '_owner_delete');
    execute format('drop policy if exists %I on storage.objects', b || '_read');

    execute format($p$
      create policy %I on storage.objects for insert to authenticated
      with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b || '_owner_write', b);

    execute format($p$
      create policy %I on storage.objects for update to authenticated
      using (bucket_id = %L and owner = auth.uid())
      with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b || '_owner_update', b, b);

    execute format($p$
      create policy %I on storage.objects for delete to authenticated
      using (bucket_id = %L and owner = auth.uid())
    $p$, b || '_owner_delete', b);

    if b = any (public_buckets) then
      execute format($p$
        create policy %I on storage.objects for select using (bucket_id = %L)
      $p$, b || '_read', b);
    else
      execute format($p$
        create policy %I on storage.objects for select to authenticated
        using (bucket_id = %L and owner = auth.uid())
      $p$, b || '_read', b);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Upload accounting. server/utils/storage.ts reads and writes this table for
-- per-user quota and admin statistics.
-- ---------------------------------------------------------------------------
-- `filename` holds the object path inside the bucket: deleteFile() looks the row
-- up by (user_id, bucket, filename) and passes it straight to storage.remove().
create table if not exists public.file_uploads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  bucket      text not null,
  filename    text not null,
  file_size   bigint not null check (file_size >= 0),
  file_type   text not null,
  metadata    jsonb not null default '{}'::jsonb,
  deleted_at  timestamptz,
  uploaded_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (bucket, filename)
);

alter table public.file_uploads drop column if exists path;
alter table public.file_uploads add column if not exists uploaded_at timestamptz not null default now();

create unique index if not exists file_uploads_object_key on public.file_uploads (bucket, filename);
create index if not exists file_uploads_user_idx on public.file_uploads (user_id, uploaded_at desc);

alter table public.file_uploads enable row level security;

drop policy if exists file_uploads_owner_read on public.file_uploads;
create policy file_uploads_owner_read on public.file_uploads
  for select to authenticated using (user_id = auth.uid());

drop policy if exists file_uploads_owner_write on public.file_uploads;
create policy file_uploads_owner_write on public.file_uploads
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists file_uploads_owner_delete on public.file_uploads;
create policy file_uploads_owner_delete on public.file_uploads
  for delete to authenticated using (user_id = auth.uid());

-- Storage consumed by a user, in bytes, ignoring soft-deleted rows.
create or replace function public.user_storage_used(p_user_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(file_size), 0)::bigint
  from public.file_uploads
  where user_id = p_user_id and deleted_at is null;
$$;
