-- Reusable question pool — shared per subject across quizzes
CREATE TABLE IF NOT EXISTS public.question_bank (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject_id    uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES public.users(id),
  question_ar   text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq', 'true_false')),
  options       jsonb,
  correct_answer text,
  points        int NOT NULL DEFAULT 1,
  tags          text[],
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON public.question_bank(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_school  ON public.question_bank(school_id);
