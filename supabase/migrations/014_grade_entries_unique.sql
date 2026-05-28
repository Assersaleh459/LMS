-- Add unique constraint to grade_entries so upsert works correctly.
-- term_id is nullable so we coalesce to a sentinel UUID to include it in the uniqueness check.
create unique index if not exists idx_grade_entries_unique
  on grade_entries(
    student_id,
    subject_id,
    grade_type,
    coalesce(term_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
