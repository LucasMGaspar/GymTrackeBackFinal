-- Add missing fields to workout_sessions table
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- Create index for student_id
CREATE INDEX IF NOT EXISTS idx_workout_sessions_student_id ON public.workout_sessions(student_id);

-- Update status check to use 'completed' instead of 'done'
ALTER TABLE public.workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_status_check;
ALTER TABLE public.workout_sessions ADD CONSTRAINT workout_sessions_status_check 
  CHECK (status IN ('in_progress', 'completed'));

-- Add target fields to workout_session_exercises
ALTER TABLE public.workout_session_exercises
  ADD COLUMN IF NOT EXISTS target_sets INT,
  ADD COLUMN IF NOT EXISTS target_reps TEXT;

-- Rename fields for consistency (actual_* naming)
ALTER TABLE public.workout_session_exercises
  RENAME COLUMN IF EXISTS sets_done TO actual_sets;

ALTER TABLE public.workout_session_exercises
  RENAME COLUMN IF EXISTS reps_done TO actual_reps;

ALTER TABLE public.workout_session_exercises
  RENAME COLUMN IF EXISTS load TO actual_load;
