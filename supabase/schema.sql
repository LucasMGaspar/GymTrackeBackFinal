-- =====================================================
-- Personal Trainer SaaS - Database Schema
-- =====================================================
-- Execute this file in Supabase SQL Editor
-- Make sure to run this as a superuser or with sufficient privileges

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('personal', 'student')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table (manages personal-student relationships)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises library
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout templates (by weekday)
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, weekday)
);

-- Exercises in workout templates
CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  target_sets INT NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '10',
  notes TEXT
);

-- Workout sessions (actual workout executions)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'done')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_user_id, session_date)
);

-- Exercises in workout sessions (actual execution data)
CREATE TABLE IF NOT EXISTS public.workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  sets_done INT NOT NULL DEFAULT 0,
  reps_done TEXT NOT NULL DEFAULT '',
  load NUMERIC(10, 2),
  notes TEXT
);

-- =====================================================
-- INDICES
-- =====================================================

-- Students indices
CREATE INDEX IF NOT EXISTS idx_students_personal_id ON public.students(personal_id);
CREATE INDEX IF NOT EXISTS idx_students_student_user_id ON public.students(student_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(student_email);

-- Exercises indices
CREATE INDEX IF NOT EXISTS idx_exercises_personal_id_name ON public.exercises(personal_id, name);

-- Workout templates indices
CREATE INDEX IF NOT EXISTS idx_workout_templates_student_id ON public.workout_templates(student_id);

-- Workout template exercises indices
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_template_id_sort ON public.workout_template_exercises(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_exercise_id ON public.workout_template_exercises(exercise_id);

-- Workout sessions indices
CREATE INDEX IF NOT EXISTS idx_workout_sessions_student_date ON public.workout_sessions(student_user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_template_id ON public.workout_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON public.workout_sessions(status);

-- Workout session exercises indices
CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_session_sort ON public.workout_session_exercises(session_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_exercise_id ON public.workout_session_exercises(exercise_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_exercises ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================

-- Personal trainers can view their students
CREATE POLICY "Personal can view their students"
  ON public.students FOR SELECT
  USING (personal_id = auth.uid());

-- Personal trainers can insert students
CREATE POLICY "Personal can insert students"
  ON public.students FOR INSERT
  WITH CHECK (personal_id = auth.uid());

-- Personal trainers can update their students
CREATE POLICY "Personal can update their students"
  ON public.students FOR UPDATE
  USING (personal_id = auth.uid());

-- Personal trainers can delete their students
CREATE POLICY "Personal can delete their students"
  ON public.students FOR DELETE
  USING (personal_id = auth.uid());

-- Students can view their own student record
CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  USING (student_user_id = auth.uid());

-- =====================================================
-- EXERCISES POLICIES
-- =====================================================

-- Personal trainers can view their exercises
CREATE POLICY "Personal can view their exercises"
  ON public.exercises FOR SELECT
  USING (personal_id = auth.uid());

-- Personal trainers can insert exercises
CREATE POLICY "Personal can insert exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (personal_id = auth.uid());

-- Personal trainers can update their exercises
CREATE POLICY "Personal can update their exercises"
  ON public.exercises FOR UPDATE
  USING (personal_id = auth.uid());

-- Personal trainers can delete their exercises
CREATE POLICY "Personal can delete their exercises"
  ON public.exercises FOR DELETE
  USING (personal_id = auth.uid());

-- Students can view exercises that are in their templates or sessions
CREATE POLICY "Students can view exercises in their workouts"
  ON public.exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_template_exercises wte
      JOIN public.workout_templates wt ON wt.id = wte.template_id
      JOIN public.students s ON s.id = wt.student_id
      WHERE wte.exercise_id = exercises.id
      AND s.student_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workout_session_exercises wse
      JOIN public.workout_sessions ws ON ws.id = wse.session_id
      WHERE wse.exercise_id = exercises.id
      AND ws.student_user_id = auth.uid()
    )
  );

-- =====================================================
-- WORKOUT TEMPLATES POLICIES
-- =====================================================

-- Personal trainers can view templates of their students
CREATE POLICY "Personal can view student templates"
  ON public.workout_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = workout_templates.student_id
      AND students.personal_id = auth.uid()
    )
  );

-- Personal trainers can insert templates for their students
CREATE POLICY "Personal can insert student templates"
  ON public.workout_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = workout_templates.student_id
      AND students.personal_id = auth.uid()
    )
  );

-- Personal trainers can update templates of their students
CREATE POLICY "Personal can update student templates"
  ON public.workout_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = workout_templates.student_id
      AND students.personal_id = auth.uid()
    )
  );

-- Personal trainers can delete templates of their students
CREATE POLICY "Personal can delete student templates"
  ON public.workout_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = workout_templates.student_id
      AND students.personal_id = auth.uid()
    )
  );

-- Students can view their own templates
CREATE POLICY "Students can view own templates"
  ON public.workout_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = workout_templates.student_id
      AND students.student_user_id = auth.uid()
    )
  );

-- =====================================================
-- WORKOUT TEMPLATE EXERCISES POLICIES
-- =====================================================

-- Personal trainers can manage template exercises for their students
CREATE POLICY "Personal can view student template exercises"
  ON public.workout_template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates wt
      JOIN public.students s ON s.id = wt.student_id
      WHERE wt.id = workout_template_exercises.template_id
      AND s.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal can insert student template exercises"
  ON public.workout_template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_templates wt
      JOIN public.students s ON s.id = wt.student_id
      WHERE wt.id = workout_template_exercises.template_id
      AND s.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal can update student template exercises"
  ON public.workout_template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates wt
      JOIN public.students s ON s.id = wt.student_id
      WHERE wt.id = workout_template_exercises.template_id
      AND s.personal_id = auth.uid()
    )
  );

CREATE POLICY "Personal can delete student template exercises"
  ON public.workout_template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates wt
      JOIN public.students s ON s.id = wt.student_id
      WHERE wt.id = workout_template_exercises.template_id
      AND s.personal_id = auth.uid()
    )
  );

-- Students can view their own template exercises
CREATE POLICY "Students can view own template exercises"
  ON public.workout_template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates wt
      JOIN public.students s ON s.id = wt.student_id
      WHERE wt.id = workout_template_exercises.template_id
      AND s.student_user_id = auth.uid()
    )
  );

-- =====================================================
-- WORKOUT SESSIONS POLICIES
-- =====================================================

-- Students can manage their own sessions
CREATE POLICY "Students can view own sessions"
  ON public.workout_sessions FOR SELECT
  USING (student_user_id = auth.uid());

CREATE POLICY "Students can insert own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (student_user_id = auth.uid());

CREATE POLICY "Students can update own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (student_user_id = auth.uid());

CREATE POLICY "Students can delete own sessions"
  ON public.workout_sessions FOR DELETE
  USING (student_user_id = auth.uid());

-- Personal trainers can view sessions of their students
CREATE POLICY "Personal can view student sessions"
  ON public.workout_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.student_user_id = workout_sessions.student_user_id
      AND students.personal_id = auth.uid()
    )
  );

-- =====================================================
-- WORKOUT SESSION EXERCISES POLICIES
-- =====================================================

-- Students can manage exercises in their own sessions
CREATE POLICY "Students can view own session exercises"
  ON public.workout_session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_session_exercises.session_id
      AND workout_sessions.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own session exercises"
  ON public.workout_session_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_session_exercises.session_id
      AND workout_sessions.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own session exercises"
  ON public.workout_session_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_session_exercises.session_id
      AND workout_sessions.student_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can delete own session exercises"
  ON public.workout_session_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = workout_session_exercises.session_id
      AND workout_sessions.student_user_id = auth.uid()
    )
  );

-- Personal trainers can view session exercises of their students
CREATE POLICY "Personal can view student session exercises"
  ON public.workout_session_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.students s ON s.student_user_id = ws.student_user_id
      WHERE ws.id = workout_session_exercises.session_id
      AND s.personal_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS (Optional helpers)
-- =====================================================

-- Function to automatically link student when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a pending student invitation for this email
  UPDATE public.students
  SET student_user_id = NEW.id,
      status = 'active'
  WHERE student_email = NEW.email
  AND status = 'invited'
  AND student_user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to link student on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert a test personal trainer (you'll need to create this user via Supabase Auth first)
-- Example:
-- INSERT INTO public.profiles (id, role, name)
-- VALUES ('YOUR-UUID-FROM-AUTH', 'personal', 'John Personal');
