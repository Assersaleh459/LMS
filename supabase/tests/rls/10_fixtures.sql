-- Extra fixtures on top of supabase/seed.sql (run as postgres).
-- School 1 = Farabi (seed). School 2 = a second school for isolation tests.

insert into schools (id, name_ar, school_type, governorate)
values ('a0000000-0000-0000-0000-000000000001', 'مدرسة أخرى', 'public_arabic', 'الجيزة');

insert into users (id, school_id, first_name_ar, last_name_ar, role) values
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'admin2',   'x', 'school_admin'),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'teacher2', 'x', 'subject_teacher'),
  ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'student2', 'x', 'kg_primary_student');
insert into student_profiles (user_id, student_code, grade_year, stage, section, enrollment_date)
values ('a0000000-0000-0000-0000-000000000010', 'S2/001', 6, 'primary', 'أ', '2024-09-01');
insert into subjects (id, school_id, name_ar, stage, grade_year)
values ('a0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'رياضيات', 'primary', 6);
insert into grade_entries (student_id, subject_id, grade_type, total_grade, entered_by)
values ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000020', 'written', 30,
        'a0000000-0000-0000-0000-000000000002');

-- School 1 content
insert into assignments (id, subject_id, teacher_id, title_ar, assignment_type, due_date, grade_year, section, is_published) values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002',
   'واجب ١', 'written', current_date + 7, 6, 'أ', true),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002',
   'واجب ٢', 'written', current_date + 7, 6, 'أ', true);

insert into assignment_submissions (id, assignment_id, student_id, status, text_answer, submitted_at) values
  ('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'submitted', 'a', now()),
  ('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', 'submitted', 'b', now());

insert into rubrics (id, assignment_id) values ('c0000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000001');
insert into rubric_criteria (id, rubric_id, name_ar) values ('c0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000030', 'الدقة');

insert into quizzes (id, subject_id, created_by, title_ar, grade_year, section) values
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 'اختبار', 6, 'أ');
insert into quiz_questions (id, quiz_id, question_ar, question_type, options, correct_answer) values
  ('c0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000010', 'س', 'mcq', '["A","B"]', 'B');
insert into quiz_attempts (id, quiz_id, student_id, score, max_score, is_complete) values
  ('c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 0, 1, true);

insert into question_bank (school_id, subject_id, created_by, question_ar, question_type, correct_answer) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 'س', 'true_false', 'true');

insert into messages (id, school_id, sender_id, recipient_id, body) values
  ('c0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'مرحبا');
insert into notifications (school_id, user_id, title_ar) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'تنبيه');

insert into conduct_entries (student_id, teacher_id, school_id, category, note_ar) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'negative', 'ملاحظة');

insert into role_permissions (school_id, role, feature, can_access) values
  ('00000000-0000-0000-0000-000000000001', 'kg_primary_student', 'grades', true),
  ('00000000-0000-0000-0000-000000000001', 'parent',             'grades', true)
on conflict do nothing;

-- ── Test harness ───────────────────────────────────────────────────────────
-- Runs one statement as the CURRENT role, then rolls it back, so every test is
-- independent. Prints PASS/FAIL against the expected outcome:
--   rows=N | rows>0 | ok (no error) | error | deny (error OR 0 rows affected)
create or replace function public._t(p_label text, p_sql text, p_expect text)
returns void language plpgsql as $$
declare
  n   bigint;
  err text;
  ok  boolean;
begin
  begin
    if p_sql ~* '^\s*(select|with)' then
      execute 'select count(*) from (' || p_sql || ') _q' into n;
    else
      execute p_sql;
      get diagnostics n = row_count;
    end if;
    raise exception '__rollback__';
  exception when others then
    if sqlerrm <> '__rollback__' then
      err := sqlstate || ' ' || sqlerrm;
      n   := null;
    end if;
  end;

  ok := case
    when p_expect = 'error'  then err is not null
    when p_expect = 'ok'     then err is null
    when p_expect = 'deny'   then err is not null or n = 0
    when p_expect = 'rows>0' then err is null and n > 0
    else err is null and n = substring(p_expect from 'rows=(\d+)')::bigint
  end;

  raise notice '% | % | expect % | got %',
    case when ok then 'PASS' else 'FAIL' end, p_label, p_expect,
    coalesce(left(err, 90), 'rows=' || n);
end $$;
grant execute on function public._t(text, text, text) to anon, authenticated;
