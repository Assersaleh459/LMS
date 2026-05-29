-- Assignment rubrics: a rubric belongs to an assignment, has 2-5 criteria.
-- Each criterion is scored 1-4 by the teacher on a submission.

CREATE TABLE IF NOT EXISTS public.rubrics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id)
);

CREATE TABLE IF NOT EXISTS public.rubric_criteria (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id   uuid NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  name_ar     text NOT NULL,
  order_num   int  NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.rubric_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  criterion_id    uuid NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
  score           int  NOT NULL CHECK (score BETWEEN 1 AND 4),
  graded_by       uuid NOT NULL REFERENCES public.users(id),
  graded_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric ON public.rubric_criteria(rubric_id);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_sub      ON public.rubric_scores(submission_id);
