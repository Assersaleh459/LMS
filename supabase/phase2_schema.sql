-- ============================================================
-- مدرستي LMS — Phase 2 Schema
-- Courses, Quizzes, Announcements, Discussions
-- ============================================================

-- ── UNITS ─────────────────────────────────────────────────────

create table units (
  id             uuid primary key default gen_random_uuid(),
  subject_id     uuid not null references subjects(id) on delete cascade,
  title_ar       text not null,
  description_ar text,
  order_num      int  not null default 1,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now()
);

create index idx_units_subject on units(subject_id, order_num);

-- ── LESSONS ───────────────────────────────────────────────────

create table lessons (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references units(id) on delete cascade,
  title_ar      text not null,
  content_type  text not null check (content_type in ('video','pdf','text','link','quiz')),
  content_url   text,
  content_text  text,
  duration_min  int,
  order_num     int not null default 1,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_lessons_unit on lessons(unit_id, order_num);

-- ── LESSON PROGRESS ───────────────────────────────────────────

create table lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references lessons(id) on delete cascade,
  student_id   uuid not null references users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create index idx_lesson_progress_student on lesson_progress(student_id);

-- ── QUIZZES ───────────────────────────────────────────────────

create table quizzes (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid not null references subjects(id) on delete cascade,
  lesson_id       uuid references lessons(id) on delete set null,
  created_by      uuid not null references users(id),
  title_ar        text not null,
  instructions_ar text,
  duration_min    int,
  pass_score      int not null default 50,
  grade_year      int not null,
  section         text not null default 'أ',
  is_published    boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_quizzes_lesson on quizzes(lesson_id);
create index idx_quizzes_subject on quizzes(subject_id);

-- ── QUIZ QUESTIONS ────────────────────────────────────────────

create table quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  question_ar    text not null,
  question_type  text not null check (question_type in ('mcq','true_false')),
  options        jsonb,
  correct_answer text,
  points         int not null default 1,
  order_num      int not null default 1,
  created_at     timestamptz not null default now()
);

create index idx_quiz_questions_quiz on quiz_questions(quiz_id, order_num);

-- ── QUIZ ATTEMPTS ─────────────────────────────────────────────

create table quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  student_id   uuid not null references users(id) on delete cascade,
  score        int not null default 0,
  max_score    int not null default 0,
  is_complete  boolean not null default false,
  submitted_at timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_quiz_attempts_student on quiz_attempts(student_id);
create index idx_quiz_attempts_quiz on quiz_attempts(quiz_id);

-- ── QUIZ ATTEMPT ANSWERS ──────────────────────────────────────

create table quiz_attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  answer_text text,
  is_correct  boolean,
  unique (attempt_id, question_id)
);

create index idx_attempt_answers_attempt on quiz_attempt_answers(attempt_id);

-- ── ANNOUNCEMENTS ─────────────────────────────────────────────

create table announcements (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  author_id    uuid not null references users(id),
  title_ar     text not null,
  body_ar      text not null,
  is_pinned    boolean not null default false,
  target_grade int,
  created_at   timestamptz not null default now()
);

create index idx_announcements_school on announcements(school_id, created_at desc);

-- ── DISCUSSION THREADS ────────────────────────────────────────

create table discussion_threads (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  author_id   uuid not null references users(id),
  title_ar    text not null,
  body_ar     text not null,
  is_pinned   boolean not null default false,
  is_locked   boolean not null default false,
  reply_count int not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_threads_subject on discussion_threads(subject_id, created_at desc);

-- ── DISCUSSION REPLIES ────────────────────────────────────────

create table discussion_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references discussion_threads(id) on delete cascade,
  author_id  uuid not null references users(id),
  body_ar    text not null,
  created_at timestamptz not null default now()
);

create index idx_replies_thread on discussion_replies(thread_id, created_at);

-- ── INCREMENT reply_count on new reply ────────────────────────

create or replace function increment_reply_count()
returns trigger language plpgsql as $$
begin
  update discussion_threads set reply_count = reply_count + 1 where id = new.thread_id;
  return new;
end;
$$;

create trigger trg_reply_count
after insert on discussion_replies
for each row execute function increment_reply_count();

-- ── ASSIGNMENT SUBMISSIONS ────────────────────────────────────
-- Table already in phase1 schema; add missing RLS policies here

-- ── ROW LEVEL SECURITY ────────────────────────────────────────

alter table units              enable row level security;
alter table lessons            enable row level security;
alter table lesson_progress    enable row level security;
alter table quizzes            enable row level security;
alter table quiz_questions     enable row level security;
alter table quiz_attempts      enable row level security;
alter table quiz_attempt_answers enable row level security;
alter table announcements      enable row level security;
alter table discussion_threads enable row level security;
alter table discussion_replies enable row level security;

-- Units & Lessons: readable by authenticated users of the same school
create policy "units_read" on units
  for select using (
    exists (select 1 from subjects s join users u on u.school_id = s.school_id
            where s.id = units.subject_id and u.id = auth.uid())
  );

create policy "units_write" on units
  for all using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

create policy "lessons_read" on lessons
  for select using (auth.uid() is not null);

create policy "lessons_write" on lessons
  for all using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

-- Lesson progress: students manage own, teachers read all
create policy "lesson_progress_student_rw" on lesson_progress
  for all using (auth.uid() = student_id);

create policy "lesson_progress_teacher_read" on lesson_progress
  for select using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

-- Quizzes: readable by authenticated, writable by teachers+
create policy "quizzes_read" on quizzes
  for select using (auth.uid() is not null);

create policy "quizzes_write" on quizzes
  for all using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

create policy "quiz_questions_read" on quiz_questions
  for select using (auth.uid() is not null);

create policy "quiz_questions_write" on quiz_questions
  for all using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

-- Quiz attempts: students manage own, teachers read school
create policy "quiz_attempts_student_rw" on quiz_attempts
  for all using (auth.uid() = student_id);

create policy "quiz_attempts_teacher_read" on quiz_attempts
  for select using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

create policy "quiz_answers_student_rw" on quiz_attempt_answers
  for all using (
    exists (select 1 from quiz_attempts qa where qa.id = quiz_attempt_answers.attempt_id and qa.student_id = auth.uid())
  );

create policy "quiz_answers_teacher_read" on quiz_attempt_answers
  for select using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

-- Announcements: school-scoped read, teachers write
create policy "announcements_read" on announcements
  for select using (
    exists (select 1 from users u where u.id = auth.uid() and u.school_id = announcements.school_id)
  );

create policy "announcements_write" on announcements
  for all using (
    exists (select 1 from users u where u.id = auth.uid()
            and u.school_id = announcements.school_id
            and u.role in ('subject_teacher','homeroom_teacher','school_admin','it_admin','chain_admin'))
  );

-- Discussions: authenticated read, authenticated write own
create policy "threads_read" on discussion_threads
  for select using (auth.uid() is not null);

create policy "threads_write" on discussion_threads
  for insert with check (auth.uid() = author_id);

create policy "threads_update" on discussion_threads
  for update using (
    auth.uid() = author_id or
    exists (select 1 from users u where u.id = auth.uid()
            and u.role in ('school_admin','it_admin','chain_admin','homeroom_teacher'))
  );

create policy "replies_read" on discussion_replies
  for select using (auth.uid() is not null);

create policy "replies_write" on discussion_replies
  for insert with check (auth.uid() = author_id);

-- ── FIX: Phase 1 RLS — add INSERT policies for admin-create-user flow ──────

create policy "admin_users_insert" on users
  for insert with check (
    exists (
      select 1 from users admin_u
      where admin_u.id = auth.uid()
        and admin_u.role in ('school_admin', 'it_admin', 'chain_admin')
    )
  );

create policy "admin_student_profiles_insert" on student_profiles
  for insert with check (
    exists (
      select 1 from users admin_u
      join users student_u on student_u.id = student_profiles.user_id
      where admin_u.id = auth.uid()
        and admin_u.role in ('school_admin', 'it_admin', 'chain_admin')
        and admin_u.school_id = student_u.school_id
    )
  );
