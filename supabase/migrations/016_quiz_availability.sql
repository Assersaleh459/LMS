-- Add availability window and max-attempts to quizzes
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS opens_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closes_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_attempts int NOT NULL DEFAULT 1;
