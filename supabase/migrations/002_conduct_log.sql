-- Behavior & conduct log
-- Homeroom teachers record positive/negative behavior events per student

create table if not exists conduct_entries (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references users(id) on delete cascade,
  teacher_id  uuid        not null references users(id) on delete cascade,
  school_id   uuid        not null references schools(id) on delete cascade,
  entry_date  date        not null default current_date,
  category    text        not null check (category in ('positive','negative','neutral')),
  note_ar     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_conduct_student on conduct_entries(student_id);
create index if not exists idx_conduct_school  on conduct_entries(school_id);
create index if not exists idx_conduct_date    on conduct_entries(entry_date desc);

alter table conduct_entries enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'conduct_entries' and policyname = 'conduct_rw'
  ) then
    create policy "conduct_rw"
      on conduct_entries for all
      using (auth.uid() is not null)
      with check (auth.uid() is not null);
  end if;
end $$;
