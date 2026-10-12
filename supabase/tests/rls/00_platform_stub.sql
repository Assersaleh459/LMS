-- Run as supabase_admin on a bare supabase/postgres image. In a real project these
-- pieces come from the Storage API and GoTrue services' own migrations.
-- Storage: only what migration 010 touches.
create table if not exists storage.buckets (
  id text primary key, name text not null, owner uuid, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

grant all on storage.buckets, storage.objects to postgres, service_role;
grant select on storage.buckets, storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;
alter table storage.objects owner to postgres;  -- lets migration 010 create policies on it

-- GoTrue (auth service) adds this in its own migrations; the bare image has the v1 auth.users
alter table auth.users add column if not exists email_confirmed_at timestamptz;

-- GoTrue's current auth.uid() (reads the PostgREST v10+ request.jwt.claims GUC too);
-- the bare image only has the v1 version that reads request.jwt.claim.sub.
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
