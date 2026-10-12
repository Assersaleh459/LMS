-- RLS regression suite (migration 025). Run via ./run.sh — see its header.
-- IDs: school1 …0001 | teacher …02 | parent …03 (children …10, …11) | admin …04
--      homeroom …05 | it …06 | chain …07 | moe …08 | students …10 …11 …12 …15
--      school2 a…01 | admin2 a…04 | teacher2 a…02 | student a…10 | subject a…20
\set QUIET on

\echo '── anon (public API key, not logged in) ──'
set role anon;
select set_config('request.jwt.claims', '', false);
select _t('anon reads users',            $q$select * from users$q$,            'rows=0');
select _t('anon reads v_student_card',   $q$select * from v_student_card$q$,   'rows=0');
select _t('anon reads role_permissions', $q$select * from role_permissions$q$, 'rows=0');
select _t('anon reads question_bank',    $q$select * from question_bank$q$,    'rows=0');
select _t('anon reads system_audit_log', $q$select * from system_audit_log$q$, 'rows=0');
select _t('anon creates custom role',    $q$insert into custom_roles (school_id, name_ar, base_role) values ('00000000-0000-0000-0000-000000000001', 'x', 'school_admin')$q$, 'error');
select _t('anon edits role_permissions', $q$update role_permissions set can_access = false$q$, 'deny');
reset role;

\echo '── student (primary, …10) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000010"}', false);
select _t('student reads own grades',           $q$select * from grade_entries where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'rows>0');
select _t('student reads other student grades', $q$select * from grade_entries where student_id <> '00000000-0000-0000-0000-000000000010'$q$, 'rows=0');
select _t('student raises own grade',           $q$update grade_entries set total_grade = 100 where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'deny');
select _t('student inserts own grade',          $q$insert into grade_entries (student_id, subject_id, term_id, grade_type, total_grade, entered_by) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000099', 'practical', 10, '00000000-0000-0000-0000-000000000010')$q$, 'error');
select _t('student marks own attendance',       $q$insert into attendance_records (student_id, teacher_id, subject_id, status, attendance_date) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', 'present', current_date + 3)$q$, 'error');
select _t('student deletes own absences',       $q$delete from attendance_records where student_id = '00000000-0000-0000-0000-000000000010' and status = 'absent'$q$, 'deny');
select _t('student reads own student card',     $q$select * from v_student_card where id = '00000000-0000-0000-0000-000000000010'$q$, 'rows=1');
select _t('student reads classmates cards',     $q$select * from v_student_card where id <> '00000000-0000-0000-0000-000000000010'$q$, 'rows=0');
select _t('student reads other-school users',   $q$select * from users where school_id = 'a0000000-0000-0000-0000-000000000001'$q$, 'rows=0');
select _t('student submits assignment',         $q$insert into assignment_submissions (assignment_id, student_id, text_answer, file_url, status, submitted_at) values ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'x', null, 'submitted', now())$q$, 'rows=1');
select _t('student submits with self-grade',    $q$insert into assignment_submissions (assignment_id, student_id, text_answer, status, grade) values ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'x', 'submitted', 10)$q$, 'error');
select _t('student edits own submission text',  $q$update assignment_submissions set text_answer = 'y', status = 'submitted', submitted_at = now() where id = 'c0000000-0000-0000-0000-000000000003'$q$, 'rows=1');
select _t('student grades own submission',      $q$update assignment_submissions set grade = 10, status = 'graded' where id = 'c0000000-0000-0000-0000-000000000003'$q$, 'error');
select _t('student reads other submissions',    $q$select * from assignment_submissions where student_id <> '00000000-0000-0000-0000-000000000010'$q$, 'rows=0');
select _t('student starts quiz attempt',        $q$insert into quiz_attempts (quiz_id, student_id, score, max_score, is_complete, submitted_at) values ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 1, 1, true, now())$q$, 'rows=1');
select _t('student saves quiz answers',         $q$insert into quiz_attempt_answers (attempt_id, question_id, answer_text, is_correct) values ('c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000011', 'B', true)$q$, 'rows=1');
select _t('student rewrites old attempt score', $q$update quiz_attempts set score = 100 where id = 'c0000000-0000-0000-0000-000000000012'$q$, 'deny');
select _t('student deletes failed attempt',     $q$delete from quiz_attempts where id = 'c0000000-0000-0000-0000-000000000012'$q$, 'deny');
select _t('student reads quiz answers [KNOWN GAP → step 2]', $q$select correct_answer from quiz_questions$q$, 'rows>0');
select _t('student reads question bank',        $q$select * from question_bank$q$, 'rows=0');
select _t('student edits role permissions',     $q$update role_permissions set can_access = true$q$, 'deny');
select _t('student creates custom role',        $q$insert into custom_roles (school_id, name_ar, base_role) values ('00000000-0000-0000-0000-000000000001', 'x', 'school_admin')$q$, 'error');
select _t('student reads system audit',         $q$select * from system_audit_log$q$, 'rows=0');
select _t('student logs own login',             $q$insert into system_audit_log (school_id, actor_id, action, entity_type) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'LOGIN', 'login')$q$, 'rows=1');
select _t('student forges audit as admin',      $q$insert into system_audit_log (school_id, actor_id, action, entity_type) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'DELETE', 'user')$q$, 'error');
select _t('student creates notification',       $q$insert into notifications (school_id, user_id, title_ar) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'x')$q$, 'error');
select _t('student reads others notifications', $q$select * from notifications where user_id <> auth.uid()$q$, 'rows=0');
select _t('student marks others notifs read',   $q$update notifications set is_read = true where user_id <> auth.uid()$q$, 'deny');
select _t('student messages teacher',           $q$insert into messages (school_id, sender_id, recipient_id, body) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'hi')$q$, 'rows=1');
select _t('student messages other school',      $q$insert into messages (school_id, sender_id, recipient_id, body) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000004', 'hi')$q$, 'error');
select _t('student spoofs message sender',      $q$insert into messages (school_id, sender_id, recipient_id, body) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'fake')$q$, 'error');
select _t('student promotes self to admin',     $q$update users set role = 'school_admin' where id = '00000000-0000-0000-0000-000000000010'$q$, 'deny');
select _t('student edits timetable',            $q$insert into timetable_slots (school_id, grade_year, section, day_of_week, period_num) values ('00000000-0000-0000-0000-000000000001', 6, 'أ', 0, 1)$q$, 'error');
select _t('student reads others conduct notes', $q$select * from conduct_entries where student_id <> '00000000-0000-0000-0000-000000000010'$q$, 'rows=0');
select _t('student reads grade audit log',      $q$select * from grade_audit_log$q$, 'rows=0');
select _t('student enrolls self in subject',    $q$insert into subject_enrollments (student_id, subject_id) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000024')$q$, 'error');
reset role;

\echo '── parent (…03, children …10 & …11) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', false);
select _t('parent reads child grades',          $q$select * from grade_entries where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'rows>0');
select _t('parent reads unlinked student grades', $q$select * from grade_entries where student_id = '00000000-0000-0000-0000-000000000015'$q$, 'rows=0');
select _t('parent reads children cards',        $q$select * from v_student_card$q$, 'rows=2');
select _t('parent reads child attendance',      $q$select * from attendance_records where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'rows>0');
select _t('parent reads child conduct',         $q$select * from conduct_entries where student_id = '00000000-0000-0000-0000-000000000011'$q$, 'rows=1');
select _t('parent edits child grade',           $q$update grade_entries set total_grade = 60 where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'deny');
select _t('parent reads own notifications',     $q$select * from notifications where user_id = auth.uid()$q$, 'rows>0');
select _t('parent sees only own notifications', $q$select * from notifications where user_id <> auth.uid()$q$, 'rows=0');
select _t('parent marks notifications read',    $q$update notifications set is_read = true where user_id = auth.uid()$q$, 'rows>0');
select _t('parent marks message read',          $q$update messages set is_read = true where id = 'c0000000-0000-0000-0000-000000000020'$q$, 'rows=1');
select _t('parent replies to teacher',          $q$insert into messages (school_id, sender_id, recipient_id, body) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'شكرا')$q$, 'rows=1');
reset role;

\echo '── subject teacher (…02) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', false);
select _t('teacher reads student grades',       $q$select * from grade_entries where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'rows>0');
select _t('teacher updates grade (enterGrade)', $q$update grade_entries set total_grade = 50, entered_by = '00000000-0000-0000-0000-000000000002' where student_id = '00000000-0000-0000-0000-000000000010' and subject_id = '00000000-0000-0000-0000-000000000020' and term_id = '00000000-0000-0000-0000-000000000099' and grade_type = 'written'$q$, 'rows=1');
select _t('teacher inserts grade',              $q$insert into grade_entries (student_id, subject_id, term_id, grade_type, total_grade, entered_by) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000099', 'practical', 8, '00000000-0000-0000-0000-000000000002')$q$, 'rows=1');
select _t('teacher forges entered_by',          $q$insert into grade_entries (student_id, subject_id, term_id, grade_type, total_grade, entered_by) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000099', 'practical', 8, '00000000-0000-0000-0000-000000000004')$q$, 'error');
select _t('teacher grades other-school student', $q$insert into grade_entries (student_id, subject_id, grade_type, total_grade, entered_by) values ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000020', 'oral', 5, '00000000-0000-0000-0000-000000000002')$q$, 'error');
select _t('teacher reads other-school grades',  $q$select * from grade_entries where student_id = 'a0000000-0000-0000-0000-000000000010'$q$, 'rows=0');
select _t('teacher marks attendance (upsert)',  $q$insert into attendance_records (student_id, teacher_id, subject_id, status, attendance_date, period_number) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000020', 'present', current_date, 1) on conflict (student_id, attendance_date, period_number) do update set status = excluded.status$q$, 'rows=1');
select _t('teacher grades submission',          $q$update assignment_submissions set grade = 9, status = 'graded', graded_at = now(), teacher_comment = 'ممتاز' where id = 'c0000000-0000-0000-0000-000000000002'$q$, 'rows=1');
select _t('teacher scores rubric',              $q$insert into rubric_scores (submission_id, criterion_id, score, graded_by) values ('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000031', 3, '00000000-0000-0000-0000-000000000002')$q$, 'rows=1');
select _t('teacher creates assignment',         $q$insert into assignments (subject_id, teacher_id, title_ar, assignment_type, due_date, grade_year, section) values ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 't', 'written', current_date + 7, 6, 'أ')$q$, 'rows=1');
select _t('teacher creates other-school assignment', $q$insert into assignments (subject_id, teacher_id, title_ar, assignment_type, due_date, grade_year, section) values ('a0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 't', 'written', current_date + 7, 6, 'أ')$q$, 'error');
select _t('teacher adds rubric criterion',      $q$insert into rubric_criteria (rubric_id, name_ar) values ('c0000000-0000-0000-0000-000000000030', 'التنظيم')$q$, 'rows=1');
select _t('teacher adds unit',                  $q$insert into units (subject_id, title_ar) values ('00000000-0000-0000-0000-000000000020', 'الوحدة')$q$, 'rows=1');
select _t('teacher creates quiz',               $q$insert into quizzes (subject_id, created_by, title_ar, grade_year, section) values ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 'q', 6, 'أ')$q$, 'rows=1');
select _t('teacher adds quiz question',         $q$insert into quiz_questions (quiz_id, question_ar, question_type, correct_answer) values ('c0000000-0000-0000-0000-000000000010', 'س٢', 'true_false', 'true')$q$, 'rows=1');
select _t('teacher saves to question bank',     $q$insert into question_bank (school_id, subject_id, created_by, question_ar, question_type, correct_answer) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', 'q', 'true_false', 'true')$q$, 'rows=1');
select _t('teacher reads question bank',        $q$select * from question_bank$q$, 'rows>0');
select _t('teacher posts announcement',         $q$insert into announcements (school_id, author_id, title_ar, body_ar) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 't', 'b')$q$, 'rows=1');
select _t('teacher logs conduct note',          $q$insert into conduct_entries (student_id, teacher_id, school_id, category, note_ar) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'positive', 'x')$q$, 'rows=1');
select _t('teacher reads grade audit log',      $q$select * from grade_audit_log$q$, 'rows>0');
select _t('teacher reads quiz attempts',        $q$select * from quiz_attempts$q$, 'rows>0');
select _t('teacher edits role permissions',     $q$update role_permissions set can_access = false$q$, 'deny');
select _t('teacher reads system audit',         $q$select * from system_audit_log$q$, 'rows=0');
select _t('teacher edits timetable',            $q$insert into timetable_slots (school_id, grade_year, section, day_of_week, period_num) values ('00000000-0000-0000-0000-000000000001', 6, 'أ', 0, 1)$q$, 'error');
reset role;

\echo '── school admin (…04) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', false);
select _t('admin reads own profile (login)',    $q$select * from users where id = '00000000-0000-0000-0000-000000000004'$q$, 'rows=1');
select _t('admin deactivates user',             $q$update users set is_active = false where id = '00000000-0000-0000-0000-000000000012'$q$, 'rows=1');
select _t('admin edits other-school user',      $q$update users set is_active = false where id = 'a0000000-0000-0000-0000-000000000010'$q$, 'deny');
select _t('admin moves user to other school',   $q$update users set school_id = 'a0000000-0000-0000-0000-000000000001' where id = '00000000-0000-0000-0000-000000000012'$q$, 'error');
select _t('admin grants chain_admin',           $q$update users set role = 'chain_admin' where id = '00000000-0000-0000-0000-000000000012'$q$, 'error');
select _t('admin creates parent user row',      $q$insert into users (id, school_id, first_name_ar, last_name_ar, role) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'أ', 'ب', 'parent')$q$, 'rows=1');
select _t('admin creates moe_supervisor row',   $q$insert into users (id, school_id, first_name_ar, last_name_ar, role) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'أ', 'ب', 'moe_supervisor')$q$, 'error');
select _t('admin edits student grade/section',  $q$update student_profiles set grade_year = 6, section = 'ب' where user_id = '00000000-0000-0000-0000-000000000012'$q$, 'rows=1');
select _t('admin reads system audit',           $q$select * from system_audit_log where school_id = '00000000-0000-0000-0000-000000000001'$q$, 'rows>0');
select _t('conduct notes are audited (026)',    $q$select * from system_audit_log where entity_type = 'conduct' and details ->> 'type' = 'negative'$q$, 'rows=1');
select _t('admin reads other-school audit',     $q$select * from system_audit_log where school_id = 'a0000000-0000-0000-0000-000000000001'$q$, 'rows=0');
select _t('admin toggles permission (upsert)',  $q$insert into role_permissions (school_id, role, feature, can_access) values ('00000000-0000-0000-0000-000000000001', 'parent', 'grades', false) on conflict (school_id, role, feature) do update set can_access = excluded.can_access$q$, 'rows=1');
select _t('admin creates custom role',          $q$insert into custom_roles (school_id, name_ar, base_role) values ('00000000-0000-0000-0000-000000000001', 'وكيل', 'subject_teacher')$q$, 'rows=1');
select _t('admin updates school settings',      $q$update schools set phone = '0220000000' where id = '00000000-0000-0000-0000-000000000001'$q$, 'rows=1');
select _t('admin updates other school',         $q$update schools set phone = '1' where id = 'a0000000-0000-0000-0000-000000000001'$q$, 'deny');
select _t('admin logs settings change',         $q$insert into school_settings_audit (school_id, changed_by, changes) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '[]')$q$, 'rows=1');
select _t('admin edits timetable',              $q$insert into timetable_slots (school_id, grade_year, section, day_of_week, period_num, subject_id) values ('00000000-0000-0000-0000-000000000001', 6, 'أ', 0, 1, '00000000-0000-0000-0000-000000000020')$q$, 'rows=1');
select _t('admin creates academic term',        $q$insert into academic_terms (school_id, name_ar, term_number, start_date, end_date) values ('00000000-0000-0000-0000-000000000001', 'ف١', 1, '2025-09-01', '2026-01-15')$q$, 'rows=1');
select _t('admin deactivates terms (rollover)', $q$update academic_terms set is_active = false where school_id = '00000000-0000-0000-0000-000000000001'$q$, 'rows>0');
select _t('admin assigns subject teacher',      $q$update subjects set teacher_id = '00000000-0000-0000-0000-000000000005' where id = '00000000-0000-0000-0000-000000000020'$q$, 'rows=1');
select _t('admin syncs teacher_subjects',       $q$insert into teacher_subjects (teacher_id, subject_id, grade_year, section, academic_year) values ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000020', 6, 'أ', '2024-2025')$q$, 'rows=1');
select _t('admin creates subject (auto-enroll)', $q$insert into subjects (school_id, name_ar, stage, grade_year) values ('00000000-0000-0000-0000-000000000001', 'دراسات', 'primary', 6)$q$, 'rows=1');
select _t('admin removes enrollment',           $q$delete from subject_enrollments where student_id = '00000000-0000-0000-0000-000000000012'$q$, 'ok');
select _t('admin reads at-risk view',           $q$select * from v_at_risk_students$q$, 'ok');
select _t('admin reads other-school users',     $q$select * from users where school_id = 'a0000000-0000-0000-0000-000000000001'$q$, 'rows=0');
reset role;

\echo '── IT admin (…06) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000006"}', false);
select _t('it admin toggles permission',        $q$update role_permissions set can_access = true where school_id = '00000000-0000-0000-0000-000000000001'$q$, 'rows>0');
select _t('it admin reads other-school users',  $q$select * from users where school_id = 'a0000000-0000-0000-0000-000000000001'$q$, 'rows=0');
reset role;

\echo '── chain admin (…07) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000007"}', false);
select _t('chain reads all schools',            $q$select * from schools$q$, 'rows=2');
select _t('chain reads other-school users',     $q$select * from users where school_id = 'a0000000-0000-0000-0000-000000000001'$q$, 'rows>0');
select _t('chain reads other-school grades',    $q$select * from grade_entries where student_id = 'a0000000-0000-0000-0000-000000000010'$q$, 'rows>0');
select _t('chain writes other-school grade',    $q$insert into grade_entries (student_id, subject_id, grade_type, total_grade, entered_by) values ('a0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000020', 'oral', 5, '00000000-0000-0000-0000-000000000007')$q$, 'error');
select _t('chain edits other-school user',      $q$update users set is_active = false where id = 'a0000000-0000-0000-0000-000000000010'$q$, 'deny');
reset role;

\echo '── MoE supervisor (…08) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000008"}', false);
select _t('moe reads other-school users',       $q$select * from users where school_id = 'a0000000-0000-0000-0000-000000000001'$q$, 'rows>0');
select _t('moe edits a grade',                  $q$update grade_entries set total_grade = 1$q$, 'deny');
select _t('moe marks attendance',               $q$insert into attendance_records (student_id, teacher_id, subject_id, status, attendance_date) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000020', 'absent', current_date + 5)$q$, 'error');
reset role;

\echo '── other-school admin (a…04) ──'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', false);
select _t('school2 admin reads school1 users',  $q$select * from users where school_id = '00000000-0000-0000-0000-000000000001'$q$, 'rows=0');
select _t('school2 admin reads school1 grades', $q$select * from grade_entries where student_id = '00000000-0000-0000-0000-000000000010'$q$, 'rows=0');
select _t('school2 admin edits school1 perms',  $q$update role_permissions set can_access = false where school_id = '00000000-0000-0000-0000-000000000001'$q$, 'deny');
reset role;
