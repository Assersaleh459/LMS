-- School settings audit log
-- Tracks every save on the school settings page for accountability

create table if not exists school_settings_audit (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  changed_by  uuid        not null references users(id) on delete cascade,
  changed_at  timestamptz not null default now(),
  changes     jsonb       not null  -- array of {field, old_value, new_value}
);

create index if not exists idx_school_audit_school  on school_settings_audit(school_id);
create index if not exists idx_school_audit_changed on school_settings_audit(changed_at desc);

alter table school_settings_audit enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'school_settings_audit' and policyname = 'school_audit_read'
  ) then
    create policy "school_audit_read"
      on school_settings_audit for select
      using (auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'school_settings_audit' and policyname = 'school_audit_insert'
  ) then
    create policy "school_audit_insert"
      on school_settings_audit for insert
      with check (auth.uid() is not null);
  end if;
end $$;
