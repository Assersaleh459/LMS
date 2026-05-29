-- Auto-enroll students into a subject when the subject is created.
-- Matches students in the same school, grade_year, and section.

CREATE OR REPLACE FUNCTION public.fn_auto_enroll_students()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.subject_enrollments (student_id, subject_id, enrolled_at)
  SELECT
    sp.user_id,
    NEW.id,
    NOW()
  FROM public.student_profiles sp
  JOIN public.users u ON u.id = sp.user_id
  WHERE u.school_id = NEW.school_id
    AND sp.grade_year = NEW.grade_year
    AND u.role IN ('kg_primary_student', 'prep_secondary_student')
    AND u.is_active = true
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_enroll ON public.subjects;
CREATE TRIGGER trg_auto_enroll
  AFTER INSERT ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_enroll_students();
