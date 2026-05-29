-- Idempotent re-deploy of the grade audit log trigger.
-- Safe to run multiple times (uses create or replace + drop if exists).

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
