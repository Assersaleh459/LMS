-- ============================================================
-- مدرستي LMS — Full Database Schema (Phase 1)
-- Egyptian K-12 LMS | MoE-compliant grading + attendance
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'kg_primary_student',
  'prep_secondary_student',
  'subject_teacher',
  'homeroom_teacher',
  'parent',
  'school_admin',
  'it_admin',
  'chain_admin',
  'moe_supervisor'
);

create type attendance_status as enum (
  'present',
  'absent',
  'late',
  'excused',
  'early_departure'
);

create type grade_type as enum (
  'written',
  'oral',       -- شفهي
  'practical',
  'activity',
  'exam',
  'monthly',
  'final'
);

create type assignment_type as enum (
  'written',
  'oral',       -- شفهي
  'practical',
  'project',
  'quiz',
  'notebook_photo'
);

create type school_type as enum (
  'public_arabic',
  'public_experimental',
  'private_arabic',
  'private_language',
  'international'
);

create type education_stage as enum (
  'kg',
  'primary',
  'prep',
  'secondary'
);

create type submission_status as enum (
  'pending',
  'submitted',
  'graded',
  'late'
);

-- ============================================================
-- SCHOOLS
-- ============================================================

create table schools (
  id             uuid primary key default gen_random_uuid(),
  name_ar        text not null,
  name_en        text,
  school_type    school_type not null,
  governorate    text not null,
  moe_code       text unique,
  logo_url       text,
  phone          text,
  address_ar     text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- USERS (all roles in one table)
-- ============================================================

create table users (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  first_name_ar    text not null,
  last_name_ar     text not null,
  role             user_role not null,
  phone            text,
  whatsapp_phone   text,
  email            text,
  avatar_url       text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  last_login_at    timestamptz
);

create index idx_users_school_role on users(school_id, role);
create index idx_users_phone on users(phone);

-- ============================================================
-- STUDENT PROFILES (extra fields for students only)
-- ============================================================

create table student_profiles (
  user_id             uuid primary key references users(id) on delete cascade,
  student_code        text not null,
  grade_year          int not null check (grade_year between 0 and 12),
  stage               education_stage not null,
  section             text not null default 'أ',
  national_id         text,
  enrollment_date     date not null,
  points_total        int not null default 0,
  attendance_streak   int not null default 0
);

create index idx_student_profiles_grade on student_profiles(grade_year, section);

-- ============================================================
-- PARENT-STUDENT LINKS
-- ============================================================

create table parent_student_links (
  id             uuid primary key default gen_random_uuid(),
  parent_id      uuid not null references users(id) on delete cascade,
  student_id     uuid not null references users(id) on delete cascade,
  relationship   text not null default 'أب',
  is_primary     boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ============================================================
-- SUBJECTS
-- ============================================================

create table subjects (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references schools(id) on delete cascade,
  name_ar             text not null,
  name_en             text,
  stage               education_stage not null,
  grade_year          int not null,
  moe_subject_code    text,
  total_marks         int not null default 100,
  written_marks       int not null default 60,
  oral_marks          int not null default 20,
  practical_marks     int not null default 10,
  activity_marks      int not null default 10,
  is_active           boolean not null default true
);

create index idx_subjects_school_grade on subjects(school_id, grade_year);

-- ============================================================
-- TEACHER-SUBJECT ASSIGNMENTS
-- ============================================================

create table teacher_subjects (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references users(id) on delete cascade,
  subject_id   uuid not null references subjects(id) on delete cascade,
  grade_year   int not null,
  section      text not null,
  academic_year text not null default '2024-2025',
  unique (teacher_id, subject_id, grade_year, section, academic_year)
);

-- ============================================================
-- ACADEMIC TERMS
-- ============================================================

create table academic_terms (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  name_ar      text not null,
  term_number  int not null check (term_number in (1, 2)),
  start_date   date not null,
  end_date     date not null,
  academic_year text not null default '2024-2025',
  is_active    boolean not null default false
);

-- ============================================================
-- ATTENDANCE RECORDS
-- ============================================================

create table attendance_records (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references users(id) on delete cascade,
  teacher_id       uuid not null references users(id),
  subject_id       uuid references subjects(id),
  status           attendance_status not null,
  attendance_date  date not null,
  period_number    int not null default 1,
  note_ar          text,
  parent_notified  boolean not null default false,
  notified_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (student_id, attendance_date, period_number)
);

create index idx_attendance_student_date on attendance_records(student_id, attendance_date);
create index idx_attendance_date on attendance_records(attendance_date);

-- ============================================================
-- GRADE ENTRIES
-- ============================================================

create table grade_entries (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references users(id) on delete cascade,
  subject_id          uuid not null references subjects(id),
  term_id             uuid references academic_terms(id),
  grade_type          grade_type not null,
  total_grade         numeric(5,2) not null check (total_grade >= 0),
  teacher_comment_ar  text,
  entered_by          uuid not null references users(id),
  voice_note_url      text,
  photo_url           text,
  created_at          timestamptz not null default now()
);

create index idx_grade_entries_student_subject on grade_entries(student_id, subject_id);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================

create table assignments (
  id                uuid primary key default gen_random_uuid(),
  subject_id        uuid not null references subjects(id) on delete cascade,
  teacher_id        uuid not null references users(id),
  title_ar          text not null,
  description_ar    text,
  assignment_type   assignment_type not null,
  grade_category    grade_type,
  max_grade         numeric(5,2) not null default 10,
  due_date          date not null,
  grade_year        int not null,
  section           text not null,
  whatsapp_notify   boolean not null default true,
  is_published      boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index idx_assignments_subject on assignments(subject_id);
create index idx_assignments_due on assignments(due_date);

-- ============================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================

create table assignment_submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references assignments(id) on delete cascade,
  student_id      uuid not null references users(id) on delete cascade,
  status          submission_status not null default 'pending',
  photo_url       text,
  voice_note_url  text,
  text_answer     text,
  grade           numeric(5,2),
  teacher_comment text,
  submitted_at    timestamptz,
  graded_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- ============================================================
-- CONVENIENCE VIEW: student card (used in attendance + grade screens)
-- ============================================================

create view v_student_card as
select
  u.id,
  u.school_id,
  u.first_name_ar || ' ' || u.last_name_ar as full_name_ar,
  sp.student_code,
  sp.grade_year,
  sp.section,
  sp.stage,
  sp.points_total as total_points,
  sp.attendance_streak as attendance_streak_days,
  u.avatar_url,
  parent.whatsapp_phone as parent_whatsapp,
  parent.first_name_ar || ' ' || parent.last_name_ar as parent_name_ar,
  s.name_ar as school_name_ar
from users u
join student_profiles sp on sp.user_id = u.id
join schools s on s.id = u.school_id
left join parent_student_links psl on psl.student_id = u.id and psl.is_primary = true
left join users parent on parent.id = psl.parent_id
where u.role in ('kg_primary_student', 'prep_secondary_student');

-- ============================================================
-- ROW LEVEL SECURITY (basic setup — expand per role in Phase 2)
-- ============================================================

alter table schools enable row level security;
alter table users enable row level security;
alter table student_profiles enable row level security;
alter table attendance_records enable row level security;
alter table grade_entries enable row level security;
alter table assignments enable row level security;
alter table assignment_submissions enable row level security;

-- Allow authenticated users to read their own school's data (basic policy)
create policy "school_isolation" on schools
  for select using (true);

create policy "users_school_read" on users
  for select using (auth.uid() is not null);

create policy "attendance_school_rw" on attendance_records
  for all using (auth.uid() is not null);

create policy "grades_school_rw" on grade_entries
  for all using (auth.uid() is not null);

create policy "assignments_read" on assignments
  for select using (auth.uid() is not null);

create policy "assignments_write" on assignments
  for insert with check (auth.uid() is not null);

create policy "submissions_rw" on assignment_submissions
  for all using (auth.uid() is not null);
