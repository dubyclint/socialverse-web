-- Chat attachments are referenced by URL in chat_messages.attachment_urls, so
-- every member of the room must be able to fetch them. Object names are
-- <uploader uuid>/<random>, which keeps them unguessable.
update storage.buckets
set public = true,
    file_size_limit = 26214400,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif','image/heic',
      'video/mp4','video/webm','video/quicktime',
      'audio/mpeg','audio/ogg','audio/webm','audio/mp4','audio/aac','audio/wav','audio/x-m4a',
      'application/pdf'
    ]
where id = 'chat-media';

drop policy if exists "chat-media_read" on storage.objects;
create policy "chat-media_read" on storage.objects
  for select using (bucket_id = 'chat-media');
