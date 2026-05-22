-- ============================================================
-- Phase 2: LMS Content, Quizzes, Discussions, Announcements
-- ============================================================

-- ============================================================
-- UNITS (chapters within a subject)
-- ============================================================
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

-- ============================================================
-- LESSONS (within units)
-- ============================================================
create table lessons (
  id             uuid primary key default gen_random_uuid(),
  unit_id        uuid not null references units(id) on delete cascade,
  title_ar       text not null,
  content_type   text not null check (content_type in ('video','pdf','text','link','quiz')),
  content_url    text,
  content_text   text,
  duration_min   int,
  order_num      int  not null default 1,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now()
);
create index idx_lessons_unit on lessons(unit_id, order_num);

-- Track which lessons a student has completed
create table lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references lessons(id) on delete cascade,
  student_id   uuid not null references users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  subject_id  uuid references subjects(id) on delete cascade,
  author_id   uuid not null references users(id),
  title_ar    text not null,
  body_ar     text not null,
  grade_year  int,
  section     text,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_announcements_school on announcements(school_id, created_at desc);
create index idx_announcements_subject on announcements(subject_id, created_at desc);

-- ============================================================
-- QUIZZES
-- ============================================================
create table quizzes (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references subjects(id) on delete cascade,
  lesson_id    uuid references lessons(id) on delete set null,
  created_by   uuid not null references users(id),
  title_ar     text not null,
  instructions_ar text,
  duration_min int,
  max_attempts int not null default 1,
  pass_score   numeric(5,2) not null default 50,
  is_published boolean not null default false,
  due_date     timestamptz,
  grade_year   int not null,
  section      text not null,
  created_at   timestamptz not null default now()
);
create index idx_quizzes_subject on quizzes(subject_id);

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
create table quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  question_ar    text not null,
  question_type  text not null check (question_type in ('mcq','true_false','short')),
  options        jsonb,          -- MCQ: [{"text":"...","is_correct":true}, ...]
  correct_answer text,           -- true_false: 'true'/'false', short: model answer
  points         numeric(5,2) not null default 1,
  order_num      int not null default 1
);
create index idx_quiz_questions_quiz on quiz_questions(quiz_id, order_num);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
create table quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  student_id   uuid not null references users(id) on delete cascade,
  score        numeric(5,2),
  max_score    numeric(5,2),
  is_complete  boolean not null default false,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz
);
create index idx_quiz_attempts_student on quiz_attempts(student_id, quiz_id);

create table quiz_attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id),
  answer_text text,
  is_correct  boolean
);

-- ============================================================
-- DISCUSSION THREADS
-- ============================================================
create table discussion_threads (
  id         uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  author_id  uuid not null references users(id),
  title_ar   text not null,
  body_ar    text not null,
  is_pinned  boolean not null default false,
  is_locked  boolean not null default false,
  reply_count int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_threads_subject on discussion_threads(subject_id, created_at desc);

create table discussion_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references discussion_threads(id) on delete cascade,
  author_id  uuid not null references users(id),
  body_ar    text not null,
  created_at timestamptz not null default now()
);
create index idx_replies_thread on discussion_replies(thread_id, created_at);

-- Keep reply_count in sync
create or replace function increment_reply_count()
returns trigger language plpgsql as $$
begin
  update discussion_threads set reply_count = reply_count + 1 where id = NEW.thread_id;
  return NEW;
end;
$$;
create trigger trg_reply_count after insert on discussion_replies
  for each row execute function increment_reply_count();

-- ============================================================
-- MEETING SESSIONS (Zoom / Google Meet links)
-- ============================================================
create table meeting_sessions (
  id            uuid primary key default gen_random_uuid(),
  subject_id    uuid not null references subjects(id) on delete cascade,
  teacher_id    uuid not null references users(id),
  title_ar      text not null,
  meeting_url   text not null,
  scheduled_at  timestamptz not null,
  duration_min  int not null default 60,
  grade_year    int not null,
  section       text not null,
  created_at    timestamptz not null default now()
);
create index idx_meetings_subject on meeting_sessions(subject_id, scheduled_at);

-- ============================================================
-- RLS
-- ============================================================
alter table units              enable row level security;
alter table lessons            enable row level security;
alter table lesson_progress    enable row level security;
alter table announcements      enable row level security;
alter table quizzes            enable row level security;
alter table quiz_questions     enable row level security;
alter table quiz_attempts      enable row level security;
alter table quiz_attempt_answers enable row level security;
alter table discussion_threads enable row level security;
alter table discussion_replies enable row level security;
alter table meeting_sessions   enable row level security;

create policy "units_read"      on units              for select using (auth.uid() is not null);
create policy "lessons_read"    on lessons            for select using (auth.uid() is not null);
create policy "progress_rw"     on lesson_progress    for all    using (auth.uid() is not null);
create policy "announcements_r" on announcements      for select using (auth.uid() is not null);
create policy "announcements_w" on announcements      for insert with check (auth.uid() is not null);
create policy "quizzes_read"    on quizzes            for select using (auth.uid() is not null);
create policy "quiz_q_read"     on quiz_questions     for select using (auth.uid() is not null);
create policy "attempts_rw"     on quiz_attempts      for all    using (auth.uid() is not null);
create policy "answers_rw"      on quiz_attempt_answers for all  using (auth.uid() is not null);
create policy "threads_read"    on discussion_threads for select using (auth.uid() is not null);
create policy "threads_write"   on discussion_threads for insert with check (auth.uid() is not null);
create policy "replies_read"    on discussion_replies for select using (auth.uid() is not null);
create policy "replies_write"   on discussion_replies for insert with check (auth.uid() is not null);
create policy "meetings_read"   on meeting_sessions   for select using (auth.uid() is not null);
create policy "meetings_write"  on meeting_sessions   for insert with check (auth.uid() is not null);

-- Teachers can manage their content
create policy "units_write"   on units    for all using (auth.uid() is not null);
create policy "lessons_write" on lessons  for all using (auth.uid() is not null);
create policy "quizzes_write" on quizzes  for all using (auth.uid() is not null);
create policy "quiz_q_write"  on quiz_questions for all using (auth.uid() is not null);
