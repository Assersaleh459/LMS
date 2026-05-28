-- Class timetable
-- One row per period slot: school + grade + section + day + period → subject + teacher

create table if not exists timetable_slots (
  id          uuid    primary key default gen_random_uuid(),
  school_id   uuid    not null references schools(id) on delete cascade,
  grade_year  int     not null check (grade_year between 1 and 12),
  section     text    not null,
  day_of_week int     not null check (day_of_week between 0 and 6), -- 0=Sun … 6=Sat
  period_num  int     not null check (period_num between 1 and 12),
  subject_id  uuid    references subjects(id) on delete set null,
  teacher_id  uuid    references users(id) on delete set null,
  start_time  time,
  end_time    time,
  created_at  timestamptz not null default now(),
  unique (school_id, grade_year, section, day_of_week, period_num)
);

create index if not exists idx_timetable_school  on timetable_slots(school_id);
create index if not exists idx_timetable_class   on timetable_slots(school_id, grade_year, section);
create index if not exists idx_timetable_teacher on timetable_slots(teacher_id);

alter table timetable_slots enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'timetable_slots' and policyname = 'timetable_read'
  ) then
    create policy "timetable_read"
      on timetable_slots for select
      using (auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'timetable_slots' and policyname = 'timetable_write'
  ) then
    create policy "timetable_write"
      on timetable_slots for all
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end $$;
