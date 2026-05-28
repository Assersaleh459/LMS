-- Create storage bucket for assignment file submissions
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  true,
  10485760, -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and schemaname = 'storage' and policyname = 'submissions_upload'
  ) then
    create policy "submissions_upload"
      on storage.objects for insert
      with check (
        bucket_id = 'submissions'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = 'submissions'
      );
  end if;
end $$;

-- Allow public read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and schemaname = 'storage' and policyname = 'submissions_read'
  ) then
    create policy "submissions_read"
      on storage.objects for select
      using (bucket_id = 'submissions');
  end if;
end $$;

-- Allow uploader to update/delete their own files
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'objects' and schemaname = 'storage' and policyname = 'submissions_owner'
  ) then
    create policy "submissions_owner"
      on storage.objects for all
      using (
        bucket_id = 'submissions'
        and auth.uid() is not null
      )
      with check (
        bucket_id = 'submissions'
        and auth.uid() is not null
      );
  end if;
end $$;
