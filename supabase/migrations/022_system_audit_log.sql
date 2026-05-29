-- ── System-wide audit log ──────────────────────────────────────────────────
-- Captures every significant action across the system for admin review.

CREATE TABLE IF NOT EXISTS public.system_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid        REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id    uuid        REFERENCES public.users(id)   ON DELETE SET NULL,
  actor_name  text,
  actor_role  text,
  action      text        NOT NULL, -- CREATE | UPDATE | DELETE | LOGIN | LOGOUT | PUBLISH
  entity_type text        NOT NULL, -- user | grade | attendance | assignment | setting | conduct | quiz | announcement
  entity_id   text,
  entity_desc text,                 -- human-readable summary of what changed
  details     jsonb,                -- old/new values or extra context
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_school   ON public.system_audit_log(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON public.system_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity   ON public.system_audit_log(entity_type, entity_id);

-- ── Trigger: log user table changes ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_audit_users()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_audit_log
      (school_id, entity_type, entity_id, entity_desc, action, details)
    VALUES
      (NEW.school_id, 'user', NEW.id::text,
       NEW.first_name_ar || ' ' || NEW.last_name_ar,
       'CREATE',
       jsonb_build_object('role', NEW.role, 'email', NEW.email));

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.system_audit_log
      (school_id, entity_type, entity_id, entity_desc, action, details)
    VALUES
      (NEW.school_id, 'user', NEW.id::text,
       NEW.first_name_ar || ' ' || NEW.last_name_ar,
       'UPDATE',
       jsonb_build_object(
         'changed_fields', (
           SELECT jsonb_object_agg(key, jsonb_build_object('from', old_val, 'to', new_val))
           FROM (
             SELECT key,
               (to_jsonb(OLD))->key AS old_val,
               (to_jsonb(NEW))->key AS new_val
             FROM jsonb_object_keys(to_jsonb(NEW)) AS key
             WHERE (to_jsonb(OLD))->key IS DISTINCT FROM (to_jsonb(NEW))->key
               AND key NOT IN ('created_at','last_login_at')
           ) diff
         )
       ));

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.system_audit_log
      (school_id, entity_type, entity_id, entity_desc, action, details)
    VALUES
      (OLD.school_id, 'user', OLD.id::text,
       OLD.first_name_ar || ' ' || OLD.last_name_ar,
       'DELETE',
       jsonb_build_object('role', OLD.role, 'email', OLD.email));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_users ON public.users;
CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_users();

-- ── Trigger: log assignment creates/publishes ───────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_audit_assignments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_audit_log
      (school_id, actor_id, entity_type, entity_id, entity_desc, action, details)
    VALUES (
      (SELECT school_id FROM public.subjects WHERE id = NEW.subject_id),
      NEW.teacher_id, 'assignment', NEW.id::text, NEW.title_ar, 'CREATE',
      jsonb_build_object('type', NEW.assignment_type, 'due_date', NEW.due_date, 'max_grade', NEW.max_grade)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true THEN
    INSERT INTO public.system_audit_log
      (school_id, actor_id, entity_type, entity_id, entity_desc, action, details)
    VALUES (
      (SELECT school_id FROM public.subjects WHERE id = NEW.subject_id),
      NEW.teacher_id, 'assignment', NEW.id::text, NEW.title_ar, 'PUBLISH',
      jsonb_build_object('grade_year', NEW.grade_year, 'section', NEW.section)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_assignments ON public.assignments;
CREATE TRIGGER trg_audit_assignments
  AFTER INSERT OR UPDATE OF is_published ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_assignments();

-- ── Trigger: log conduct entries ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_audit_conduct()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.system_audit_log
    (school_id, actor_id, entity_type, entity_id, entity_desc, action, details)
  VALUES (
    (SELECT school_id FROM public.users WHERE id = NEW.student_id),
    NEW.teacher_id, 'conduct', NEW.id::text,
    (SELECT first_name_ar || ' ' || last_name_ar FROM public.users WHERE id = NEW.student_id),
    'CREATE',
    jsonb_build_object('type', NEW.entry_type, 'note', left(NEW.note_ar, 100))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_conduct ON public.conduct_entries;
CREATE TRIGGER trg_audit_conduct
  AFTER INSERT ON public.conduct_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_conduct();

-- ── Trigger: log school settings changes ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_audit_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.system_audit_log
      (school_id, entity_type, entity_id, entity_desc, action, details)
    VALUES (
      NEW.id, 'setting', NEW.id::text, NEW.name_ar, 'UPDATE',
      jsonb_build_object(
        'changed', (
          SELECT jsonb_object_agg(k, jsonb_build_object('from',(to_jsonb(OLD))->k,'to',(to_jsonb(NEW))->k))
          FROM jsonb_object_keys(to_jsonb(NEW)) k
          WHERE (to_jsonb(OLD))->k IS DISTINCT FROM (to_jsonb(NEW))->k
            AND k NOT IN ('created_at','updated_at')
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_settings ON public.schools;
CREATE TRIGGER trg_audit_settings
  AFTER UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_settings();
