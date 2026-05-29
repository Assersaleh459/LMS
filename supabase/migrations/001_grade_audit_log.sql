-- Grade change audit log
-- Tracks every insert/update to grade_entries for MoE inspection compliance

create table if not exists grade_audit_log (
  id          uuid        primary key default gen_random_uuid(),
  grade_id    uuid        references grade_entries(id) on delete set null,
  student_id  uuid        not null,
  subject_id  uuid        not null,
  grade_type  grade_type  not null,
  old_grade   numeric,
  new_grade   numeric     not null,
  changed_by  uuid        not null,
  changed_at  timestamptz not null default now()
);

create index if not exists idx_grade_audit_student on grade_audit_log(student_id);
create index if not exists idx_grade_audit_changed_at on grade_audit_log(changed_at desc);

alter table grade_audit_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'grade_audit_log' and policyname = 'grade_audit_read'
  ) then
    create policy "grade_audit_read"
      on grade_audit_log for select
      using (auth.uid() is not null);
  end if;
end $$;

-- Trigger function
create or replace function log_grade_change()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into grade_audit_log
      (grade_id, student_id, subject_id, grade_type, old_grade, new_grade, changed_by)
    values
      (NEW.id, NEW.student_id, NEW.subject_id, NEW.grade_type, null, NEW.total_grade, NEW.entered_by);
  elsif TG_OP = 'UPDATE' and OLD.total_grade is distinct from NEW.total_grade then
    insert into grade_audit_log
      (grade_id, student_id, subject_id, grade_type, old_grade, new_grade, changed_by)
    values
      (NEW.id, NEW.student_id, NEW.subject_id, NEW.grade_type, OLD.total_grade, NEW.total_grade, NEW.entered_by);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists grade_entry_audit on grade_entries;

create trigger grade_entry_audit
  after insert or update on grade_entries
  for each row execute function log_grade_change();
