-- Subject enrollment table (student ↔ subject many-to-many)
create table if not exists subject_enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references users(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(student_id, subject_id)
);
create index if not exists idx_enrollment_student on subject_enrollments(student_id);
create index if not exists idx_enrollment_subject on subject_enrollments(subject_id);
alter table subject_enrollments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='subject_enrollments' and policyname='enrollment_read') then
    create policy "enrollment_read" on subject_enrollments for select using (auth.uid() is not null);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='subject_enrollments' and policyname='enrollment_write') then
    create policy "enrollment_write" on subject_enrollments for all using (auth.uid() is not null) with check (auth.uid() is not null);
  end if;
end $$;
