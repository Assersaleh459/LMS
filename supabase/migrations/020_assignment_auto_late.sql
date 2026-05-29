-- Auto-mark pending submissions as late when the assignment due date has passed.
-- Runs as a trigger on assignment_submissions INSERT/UPDATE and on assignments UPDATE.

CREATE OR REPLACE FUNCTION public.fn_auto_late_submission()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- When a submission is inserted or updated, check its assignment's due date
  IF NEW.status = 'pending' THEN
    SELECT due_date INTO STRICT NEW.status
    FROM public.assignments
    WHERE id = NEW.assignment_id AND due_date < CURRENT_DATE;
    -- If due_date < today, override status to 'late'
    IF FOUND THEN
      NEW.status := 'late';
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN NEW;
  WHEN TOO_MANY_ROWS  THEN RETURN NEW;
END;
$$;

-- Rewrite with cleaner logic (avoid STRICT issues)
CREATE OR REPLACE FUNCTION public.fn_auto_late_submission()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_due date;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT due_date INTO v_due FROM public.assignments WHERE id = NEW.assignment_id;
    IF v_due IS NOT NULL AND v_due < CURRENT_DATE THEN
      NEW.status := 'late';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_late_submission ON public.assignment_submissions;
CREATE TRIGGER trg_auto_late_submission
  BEFORE INSERT OR UPDATE OF status ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_late_submission();

-- Also bulk-update any existing pending submissions past due date
UPDATE public.assignment_submissions sub
SET    status = 'late'
FROM   public.assignments a
WHERE  sub.assignment_id = a.id
  AND  sub.status = 'pending'
  AND  a.due_date < CURRENT_DATE;
