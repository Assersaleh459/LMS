-- ── 026: Fix two schema/trigger mismatches ────────────────────────────────

-- 1. fn_audit_conduct (migration 022) read NEW.entry_type, but conduct_entries
--    (migration 002) names the column `category`, so every conduct insert errored.
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
    jsonb_build_object('type', NEW.category, 'note', left(NEW.note_ar, 100))
  );
  RETURN NEW;
END;
$$;

-- 2. The announcement notification trigger (migration 009) reads
--    NEW.target_grade, which phase2_schema.sql defines but phase2.sql does not.
--    No-op where the column already exists.
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_grade int;
