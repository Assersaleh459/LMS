-- ── 025: Row-level security lockdown ───────────────────────────────────────
-- Replaces every "auth.uid() is not null" policy with role + school scoped rules.
--
--   * Reads are limited to the caller's own school. chain_admin and
--     moe_supervisor keep cross-school READ (ChainDashboard depends on it).
--   * Grades / attendance / conduct: written by staff of the student's school,
--     read by the student, their linked parents, and staff of that school.
--   * Students can submit their own work but cannot set grade fields.
--   * Admin tables (permissions, roles, audit, settings) are admin-only.
--   * Tables from migrations 016–024 get RLS for the first time.
--   * Views run with the caller's permissions (security_invoker).
--
-- NOT covered here (later steps): quiz answers are still readable by students
-- and scored client-side; the `submissions` storage bucket is still public.
--
-- Idempotent: drops ALL existing policies on the tables below first, so it
-- works whichever of phase2.sql / phase2_schema.sql was applied in prod.

begin;

-- ── 1. Helper functions (security definer → no RLS recursion on users) ─────

create or replace function public.rls_my_school() returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.users where id = auth.uid()
$$;

create or replace function public.rls_my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.users where id = auth.uid()
$$;

-- Cross-school read-only roles
create or replace function public.rls_is_global_reader() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select role in ('chain_admin','moe_supervisor') from public.users where id = auth.uid()),
    false)
$$;

-- Teachers + admins (may write academic data in their own school)
create or replace function public.rls_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin')
       from public.users where id = auth.uid()),
    false)
$$;

create or replace function public.rls_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select role in ('school_admin','it_admin','chain_admin') from public.users where id = auth.uid()),
    false)
$$;

-- Read scope: own school, or any school for global readers
create or replace function public.rls_in_my_school(p_school uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_school = public.rls_my_school() or public.rls_is_global_reader()
$$;

-- Entity → school lookups
create or replace function public.rls_user_school(p_user uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.users where id = p_user
$$;

create or replace function public.rls_subject_school(p_subject uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.subjects where id = p_subject
$$;

create or replace function public.rls_assignment_school(p_assignment uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.school_id from public.assignments a
  join public.subjects s on s.id = a.subject_id
  where a.id = p_assignment
$$;

create or replace function public.rls_unit_school(p_unit uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.school_id from public.units u
  join public.subjects s on s.id = u.subject_id
  where u.id = p_unit
$$;

create or replace function public.rls_quiz_school(p_quiz uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.school_id from public.quizzes q
  join public.subjects s on s.id = q.subject_id
  where q.id = p_quiz
$$;

create or replace function public.rls_thread_school(p_thread uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.school_id from public.discussion_threads t
  join public.subjects s on s.id = t.subject_id
  where t.id = p_thread
$$;

create or replace function public.rls_rubric_school(p_rubric uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select public.rls_assignment_school(r.assignment_id) from public.rubrics r where r.id = p_rubric
$$;

create or replace function public.rls_custom_role_school(p_role uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.custom_roles where id = p_role
$$;

create or replace function public.rls_submission_student(p_submission uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select student_id from public.assignment_submissions where id = p_submission
$$;

create or replace function public.rls_attempt_student(p_attempt uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select student_id from public.quiz_attempts where id = p_attempt
$$;

-- Student data: the student, their linked parents, staff of the student's school, global readers
create or replace function public.rls_can_read_student(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_student = auth.uid()
      or exists (select 1 from public.parent_student_links l
                 where l.parent_id = auth.uid() and l.student_id = p_student)
      or (public.rls_is_staff() and public.rls_user_school(p_student) = public.rls_my_school())
      or public.rls_is_global_reader()
$$;

-- Student data writes: staff of the student's school only
create or replace function public.rls_can_write_student(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.rls_is_staff() and public.rls_user_school(p_student) = public.rls_my_school()
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'rls_my_school()', 'rls_my_role()', 'rls_is_global_reader()', 'rls_is_staff()',
    'rls_is_admin()', 'rls_in_my_school(uuid)', 'rls_user_school(uuid)',
    'rls_subject_school(uuid)', 'rls_assignment_school(uuid)', 'rls_unit_school(uuid)',
    'rls_quiz_school(uuid)', 'rls_thread_school(uuid)', 'rls_rubric_school(uuid)',
    'rls_custom_role_school(uuid)',
    'rls_submission_student(uuid)', 'rls_attempt_student(uuid)',
    'rls_can_read_student(uuid)', 'rls_can_write_student(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ── 2. Drop every existing policy + enable RLS on all app tables ───────────

do $$
declare
  t   text;
  pol record;
  tables text[] := array[
    'schools','users','student_profiles','parent_student_links','subjects',
    'teacher_subjects','academic_terms','attendance_records','grade_entries',
    'assignments','assignment_submissions','units','lessons','lesson_progress',
    'quizzes','quiz_questions','quiz_attempts','quiz_attempt_answers',
    'announcements','discussion_threads','discussion_replies','meeting_sessions',
    'conduct_entries','grade_audit_log','school_settings_audit','timetable_slots',
    'notifications','messages','subject_enrollments','question_bank','rubrics',
    'rubric_criteria','rubric_scores','system_audit_log','role_permissions',
    'custom_roles','custom_role_permissions'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping missing table %', t;
      continue;
    end if;
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ── 3. School structure ────────────────────────────────────────────────────

create policy schools_read on public.schools for select to authenticated
  using (public.rls_in_my_school(id));
create policy schools_admin_update on public.schools for update to authenticated
  using ((select public.rls_is_admin()) and id = (select public.rls_my_school()))
  with check (id = (select public.rls_my_school()));

create policy users_read on public.users for select to authenticated
  using (public.rls_in_my_school(school_id));
-- Admins manage users in their own school; only a chain_admin may grant cross-school roles
create policy users_admin_insert on public.users for insert to authenticated
  with check (
    (select public.rls_is_admin()) and school_id = (select public.rls_my_school())
    and (role not in ('chain_admin','moe_supervisor') or (select public.rls_my_role()) = 'chain_admin'));
create policy users_admin_update on public.users for update to authenticated
  using ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()))
  with check (
    school_id = (select public.rls_my_school())
    and (role not in ('chain_admin','moe_supervisor') or (select public.rls_my_role()) = 'chain_admin'));

create policy student_profiles_read on public.student_profiles for select to authenticated
  using (public.rls_can_read_student(user_id));
create policy student_profiles_admin_write on public.student_profiles for all to authenticated
  using ((select public.rls_is_admin()) and public.rls_user_school(user_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and public.rls_user_school(user_id) = (select public.rls_my_school()));

create policy parent_links_read on public.parent_student_links for select to authenticated
  using (parent_id = auth.uid() or public.rls_can_read_student(student_id));
create policy parent_links_admin_write on public.parent_student_links for all to authenticated
  using ((select public.rls_is_admin()) and public.rls_user_school(student_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and public.rls_user_school(student_id) = (select public.rls_my_school())
              and public.rls_user_school(parent_id) = (select public.rls_my_school()));

create policy subjects_read on public.subjects for select to authenticated
  using (public.rls_in_my_school(school_id));
create policy subjects_admin_write on public.subjects for all to authenticated
  using ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()));

create policy teacher_subjects_read on public.teacher_subjects for select to authenticated
  using (public.rls_in_my_school(public.rls_subject_school(subject_id)));
create policy teacher_subjects_admin_write on public.teacher_subjects for all to authenticated
  using ((select public.rls_is_admin()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()));

create policy academic_terms_read on public.academic_terms for select to authenticated
  using (public.rls_in_my_school(school_id));
create policy academic_terms_admin_write on public.academic_terms for all to authenticated
  using ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()));

create policy timetable_read on public.timetable_slots for select to authenticated
  using (public.rls_in_my_school(school_id));
create policy timetable_admin_write on public.timetable_slots for all to authenticated
  using ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and school_id = (select public.rls_my_school()));

create policy enrollments_read on public.subject_enrollments for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy enrollments_admin_write on public.subject_enrollments for all to authenticated
  using ((select public.rls_is_admin()) and public.rls_user_school(student_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_admin()) and public.rls_user_school(student_id) = (select public.rls_my_school()));

-- ── 4. Student records: attendance, grades, conduct ────────────────────────

create policy attendance_read on public.attendance_records for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy attendance_staff_write on public.attendance_records for all to authenticated
  using (public.rls_can_write_student(student_id))
  with check (public.rls_can_write_student(student_id));

create policy grades_read on public.grade_entries for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy grades_staff_write on public.grade_entries for all to authenticated
  using (public.rls_can_write_student(student_id))
  with check (public.rls_can_write_student(student_id) and entered_by = auth.uid());

create policy grade_audit_read on public.grade_audit_log for select to authenticated
  using (public.rls_can_write_student(student_id) or (select public.rls_is_global_reader()));
-- (inserts come only from the security-definer trigger)

create policy conduct_read on public.conduct_entries for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy conduct_staff_write on public.conduct_entries for all to authenticated
  using (public.rls_can_write_student(student_id) and school_id = (select public.rls_my_school()))
  with check (public.rls_can_write_student(student_id) and school_id = (select public.rls_my_school())
              and teacher_id = auth.uid());

-- ── 5. Assignments, submissions, rubrics ───────────────────────────────────

create policy assignments_read on public.assignments for select to authenticated
  using (public.rls_in_my_school(public.rls_subject_school(subject_id)));
create policy assignments_staff_write on public.assignments for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()));

create policy submissions_read on public.assignment_submissions for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy submissions_student_insert on public.assignment_submissions for insert to authenticated
  with check (student_id = auth.uid()
              and public.rls_assignment_school(assignment_id) = (select public.rls_my_school()));
create policy submissions_student_update on public.assignment_submissions for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
create policy submissions_staff_write on public.assignment_submissions for all to authenticated
  using (public.rls_can_write_student(student_id))
  with check (public.rls_can_write_student(student_id));

-- RLS can't restrict columns: stop students from grading their own submission
create or replace function public.fn_guard_submission_grading()
returns trigger language plpgsql as $$
begin
  if auth.uid() is null or public.rls_is_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.grade is not null or new.teacher_comment is not null
       or new.graded_at is not null or new.status = 'graded' then
      raise exception 'Students cannot set grading fields' using errcode = '42501';
    end if;
  elsif new.grade           is distinct from old.grade
     or new.teacher_comment is distinct from old.teacher_comment
     or new.graded_at       is distinct from old.graded_at
     or new.assignment_id   is distinct from old.assignment_id
     or (new.status = 'graded' and old.status is distinct from 'graded') then
    raise exception 'Students cannot set grading fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_submission_grading on public.assignment_submissions;
create trigger trg_guard_submission_grading
  before insert or update on public.assignment_submissions
  for each row execute function public.fn_guard_submission_grading();

create policy rubrics_read on public.rubrics for select to authenticated
  using (public.rls_in_my_school(public.rls_assignment_school(assignment_id)));
create policy rubrics_staff_write on public.rubrics for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_assignment_school(assignment_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_assignment_school(assignment_id) = (select public.rls_my_school()));

create policy rubric_criteria_read on public.rubric_criteria for select to authenticated
  using (public.rls_in_my_school(public.rls_rubric_school(rubric_id)));
create policy rubric_criteria_staff_write on public.rubric_criteria for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_rubric_school(rubric_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_rubric_school(rubric_id) = (select public.rls_my_school()));

create policy rubric_scores_read on public.rubric_scores for select to authenticated
  using (public.rls_can_read_student(public.rls_submission_student(submission_id)));
create policy rubric_scores_staff_write on public.rubric_scores for all to authenticated
  using (public.rls_can_write_student(public.rls_submission_student(submission_id)))
  with check (public.rls_can_write_student(public.rls_submission_student(submission_id))
              and graded_by = auth.uid());

-- ── 6. Course content and quizzes ──────────────────────────────────────────

create policy units_read on public.units for select to authenticated
  using (public.rls_in_my_school(public.rls_subject_school(subject_id)));
create policy units_staff_write on public.units for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()));

create policy lessons_read on public.lessons for select to authenticated
  using (public.rls_in_my_school(public.rls_unit_school(unit_id)));
create policy lessons_staff_write on public.lessons for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_unit_school(unit_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_unit_school(unit_id) = (select public.rls_my_school()));

create policy lesson_progress_read on public.lesson_progress for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy lesson_progress_student_write on public.lesson_progress for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy quizzes_read on public.quizzes for select to authenticated
  using (public.rls_in_my_school(public.rls_subject_school(subject_id)));
create policy quizzes_staff_write on public.quizzes for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()));

-- NOTE: still exposes correct_answer to students — fixed by server-side scoring (step 2)
create policy quiz_questions_read on public.quiz_questions for select to authenticated
  using (public.rls_in_my_school(public.rls_quiz_school(quiz_id)));
create policy quiz_questions_staff_write on public.quiz_questions for all to authenticated
  using ((select public.rls_is_staff()) and public.rls_quiz_school(quiz_id) = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and public.rls_quiz_school(quiz_id) = (select public.rls_my_school()));

-- Students may create attempts but never edit or delete them afterwards
create policy quiz_attempts_read on public.quiz_attempts for select to authenticated
  using (public.rls_can_read_student(student_id));
create policy quiz_attempts_student_insert on public.quiz_attempts for insert to authenticated
  with check (student_id = auth.uid()
              and public.rls_quiz_school(quiz_id) = (select public.rls_my_school()));

create policy quiz_answers_read on public.quiz_attempt_answers for select to authenticated
  using (public.rls_can_read_student(public.rls_attempt_student(attempt_id)));
create policy quiz_answers_student_insert on public.quiz_attempt_answers for insert to authenticated
  with check (public.rls_attempt_student(attempt_id) = auth.uid());

create policy question_bank_staff on public.question_bank for all to authenticated
  using ((select public.rls_is_staff()) and school_id = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and school_id = (select public.rls_my_school())
              and created_by = auth.uid());

-- ── 7. Communication ───────────────────────────────────────────────────────

create policy announcements_read on public.announcements for select to authenticated
  using (public.rls_in_my_school(school_id));
create policy announcements_staff_write on public.announcements for all to authenticated
  using ((select public.rls_is_staff()) and school_id = (select public.rls_my_school()))
  with check ((select public.rls_is_staff()) and school_id = (select public.rls_my_school())
              and author_id = auth.uid());

create policy threads_read on public.discussion_threads for select to authenticated
  using (public.rls_in_my_school(public.rls_subject_school(subject_id)));
create policy threads_insert on public.discussion_threads for insert to authenticated
  with check (author_id = auth.uid()
              and public.rls_subject_school(subject_id) = (select public.rls_my_school()));
create policy threads_update on public.discussion_threads for update to authenticated
  using (public.rls_subject_school(subject_id) = (select public.rls_my_school())
         and (author_id = auth.uid() or (select public.rls_is_staff())))
  with check (public.rls_subject_school(subject_id) = (select public.rls_my_school()));

create policy replies_read on public.discussion_replies for select to authenticated
  using (public.rls_in_my_school(public.rls_thread_school(thread_id)));
create policy replies_insert on public.discussion_replies for insert to authenticated
  with check (author_id = auth.uid()
              and public.rls_thread_school(thread_id) = (select public.rls_my_school()));

-- Notifications are created by security-definer triggers only
create policy notifications_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_own_update on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy notifications_own_delete on public.notifications for delete to authenticated
  using (user_id = auth.uid());

create policy messages_read on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy messages_send on public.messages for insert to authenticated
  with check (sender_id = auth.uid()
              and school_id = (select public.rls_my_school())
              and public.rls_user_school(recipient_id) = (select public.rls_my_school()));
-- Only the recipient updates a message (mark as read)
create policy messages_recipient_update on public.messages for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

do $$
begin
  if to_regclass('public.meeting_sessions') is not null then
    create policy meetings_read on public.meeting_sessions for select to authenticated
      using (public.rls_in_my_school(public.rls_subject_school(subject_id)));
    create policy meetings_staff_write on public.meeting_sessions for all to authenticated
      using ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()))
      with check ((select public.rls_is_staff()) and public.rls_subject_school(subject_id) = (select public.rls_my_school()));
  end if;
end $$;

-- ── 8. Administration: settings audit, system audit, permissions ──────────

create policy settings_audit_read on public.school_settings_audit for select to authenticated
  using (((select public.rls_is_admin()) and school_id = (select public.rls_my_school()))
         or (select public.rls_is_global_reader()));
create policy settings_audit_insert on public.school_settings_audit for insert to authenticated
  with check ((select public.rls_is_admin()) and school_id = (select public.rls_my_school())
              and changed_by = auth.uid());

create policy system_audit_read on public.system_audit_log for select to authenticated
  using (((select public.rls_is_admin()) and school_id = (select public.rls_my_school()))
         or (select public.rls_is_global_reader()));
-- Client logs its own LOGIN/LOGOUT/permission events; cannot forge another actor
create policy system_audit_insert on public.system_audit_log for insert to authenticated
  with check (actor_id = auth.uid() and school_id = (select public.rls_my_school()));

create policy role_permissions_read on public.role_permissions for select to authenticated
  using (public.rls_in_my_school(school_id));
create policy role_permissions_admin_write on public.role_permissions for all to authenticated
  using ((select public.rls_my_role()) in ('school_admin','it_admin') and school_id = (select public.rls_my_school()))
  with check ((select public.rls_my_role()) in ('school_admin','it_admin') and school_id = (select public.rls_my_school()));

create policy custom_roles_read on public.custom_roles for select to authenticated
  using (public.rls_in_my_school(school_id));
create policy custom_roles_admin_write on public.custom_roles for all to authenticated
  using ((select public.rls_my_role()) in ('school_admin','it_admin') and school_id = (select public.rls_my_school()))
  with check ((select public.rls_my_role()) in ('school_admin','it_admin') and school_id = (select public.rls_my_school()));

create policy custom_role_perms_read on public.custom_role_permissions for select to authenticated
  using (public.rls_in_my_school(public.rls_custom_role_school(custom_role_id)));
create policy custom_role_perms_admin_write on public.custom_role_permissions for all to authenticated
  using ((select public.rls_my_role()) in ('school_admin','it_admin')
         and public.rls_custom_role_school(custom_role_id) = (select public.rls_my_school()))
  with check ((select public.rls_my_role()) in ('school_admin','it_admin')
              and public.rls_custom_role_school(custom_role_id) = (select public.rls_my_school()));

-- ── 9. Views: evaluate with the caller's RLS instead of the owner's ───────

alter view public.v_student_card set (security_invoker = true);
do $$
begin
  if to_regclass('public.v_at_risk_students') is not null then
    alter view public.v_at_risk_students set (security_invoker = true);
  end if;
end $$;

commit;
