-- Add teacher_id to subjects so TeacherAssignmentPage can persist assignments
alter table subjects
  add column if not exists teacher_id uuid references users(id) on delete set null;

create index if not exists idx_subjects_teacher on subjects(teacher_id);
