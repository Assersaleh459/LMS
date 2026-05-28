-- ============================================================
-- Notification triggers
-- Writes to the notifications table on key events so the
-- NotificationsPage actually shows data.
-- ============================================================

-- ── 1. GRADE ENTRY → notify student + linked parent(s) ───────

create or replace function fn_notify_grade()
returns trigger language plpgsql security definer as $$
declare
  v_school_id   uuid;
  v_subject_ar  text;
  v_student_ar  text;
begin
  select school_id, first_name_ar || ' ' || last_name_ar
    into v_school_id, v_student_ar
    from users where id = NEW.student_id;

  select name_ar into v_subject_ar from subjects where id = NEW.subject_id;

  -- notify student
  insert into notifications(school_id, user_id, title_ar, body_ar, link)
  values (
    v_school_id,
    NEW.student_id,
    'درجة جديدة — ' || coalesce(v_subject_ar, ''),
    'درجتك: ' || NEW.total_grade || ' من ' || coalesce(NEW.max_grade::text, ''),
    '/student/grades'
  );

  -- notify parent(s)
  insert into notifications(school_id, user_id, title_ar, body_ar, link)
  select v_school_id,
         psl.parent_id,
         'درجة ' || coalesce(v_student_ar, '') || ' — ' || coalesce(v_subject_ar, ''),
         'الدرجة: ' || NEW.total_grade || ' من ' || coalesce(NEW.max_grade::text, ''),
         '/parent'
  from parent_student_links psl
  where psl.student_id = NEW.student_id;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_grade on grade_entries;
create trigger trg_notify_grade
  after insert on grade_entries
  for each row execute function fn_notify_grade();

-- ── 2. ATTENDANCE absent → notify parent(s) ──────────────────

create or replace function fn_notify_absence()
returns trigger language plpgsql security definer as $$
declare
  v_school_id  uuid;
  v_student_ar text;
  v_subject_ar text;
begin
  -- only fire for absent/late
  if NEW.status not in ('absent', 'late') then
    return NEW;
  end if;

  -- skip if parent already notified this record
  if NEW.parent_notified then
    return NEW;
  end if;

  select school_id, first_name_ar || ' ' || last_name_ar
    into v_school_id, v_student_ar
    from users where id = NEW.student_id;

  select name_ar into v_subject_ar from subjects where id = NEW.subject_id;

  insert into notifications(school_id, user_id, title_ar, body_ar, link)
  select v_school_id,
         psl.parent_id,
         case NEW.status
           when 'absent' then 'غياب — ' || coalesce(v_student_ar, '')
           else 'تأخر — ' || coalesce(v_student_ar, '')
         end,
         'في مادة ' || coalesce(v_subject_ar, '') || ' بتاريخ ' || NEW.attendance_date::text,
         '/parent'
  from parent_student_links psl
  where psl.student_id = NEW.student_id;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_absence on attendance_records;
create trigger trg_notify_absence
  after insert or update of status on attendance_records
  for each row execute function fn_notify_absence();

-- ── 3. ASSIGNMENT published → notify students in that class ──

create or replace function fn_notify_assignment()
returns trigger language plpgsql security definer as $$
declare
  v_school_id uuid;
begin
  -- only fire when is_published flips to true
  if NEW.is_published = false then return NEW; end if;
  if TG_OP = 'UPDATE' and OLD.is_published = true then return NEW; end if;

  select s.school_id into v_school_id
  from subjects s where s.id = NEW.subject_id;

  insert into notifications(school_id, user_id, title_ar, body_ar, link)
  select v_school_id,
         u.id,
         'واجب جديد — ' || NEW.title_ar,
         'موعد التسليم: ' || NEW.due_date::text,
         '/student/assignments'
  from users u
  where u.school_id = v_school_id
    and u.role in ('kg_primary_student', 'prep_secondary_student')
    and exists (
      select 1 from v_student_card sc
      where sc.id = u.id
        and sc.grade_year = NEW.grade_year
        and sc.section = NEW.section
    );

  return NEW;
end;
$$;

drop trigger if exists trg_notify_assignment on assignments;
create trigger trg_notify_assignment
  after insert or update of is_published on assignments
  for each row execute function fn_notify_assignment();

-- ── 4. ANNOUNCEMENT created → notify all school users ────────

create or replace function fn_notify_announcement()
returns trigger language plpgsql security definer as $$
begin
  insert into notifications(school_id, user_id, title_ar, body_ar, link)
  select NEW.school_id,
         u.id,
         'إعلان جديد — ' || NEW.title_ar,
         left(NEW.body_ar, 100),
         '/announcements'
  from users u
  where u.school_id = NEW.school_id
    and u.id <> NEW.author_id
    and (NEW.target_grade is null or exists (
      select 1 from v_student_card sc
      where sc.id = u.id and sc.grade_year = NEW.target_grade
    ));

  return NEW;
end;
$$;

drop trigger if exists trg_notify_announcement on announcements;
create trigger trg_notify_announcement
  after insert on announcements
  for each row execute function fn_notify_announcement();
