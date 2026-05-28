-- Fix: grade_entries has no max_grade column — remove it from notification body

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
    'درجتك: ' || NEW.total_grade || ' (' || coalesce(NEW.grade_type::text, '') || ')',
    '/student/grades'
  );

  -- notify parent(s)
  insert into notifications(school_id, user_id, title_ar, body_ar, link)
  select v_school_id,
         psl.parent_id,
         'درجة ' || coalesce(v_student_ar, '') || ' — ' || coalesce(v_subject_ar, ''),
         'الدرجة: ' || NEW.total_grade || ' (' || coalesce(NEW.grade_type::text, '') || ')',
         '/parent'
  from parent_student_links psl
  where psl.student_id = NEW.student_id;

  return NEW;
end;
$$;
