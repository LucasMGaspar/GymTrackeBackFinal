-- =====================================================
-- GOALS SYSTEM (Sistema de Metas/Objetivos)
-- Migration: 011_goals_system.sql
-- =====================================================

-- 1. Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Meta information
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'weight_loss',           -- Perder peso (kg)
    'weight_gain',           -- Ganhar peso (kg)
    'muscle_gain',           -- Ganhar massa muscular (kg)
    'fat_loss',              -- Reduzir % gordura
    'circumference_reduction', -- Reduzir circunferência (cm) - cintura, etc
    'circumference_increase',  -- Aumentar circunferência (cm) - braço, etc
    'load_increase',         -- Aumentar carga (kg) - por exercício
    'workout_frequency'      -- Frequência de treinos (treinos/mês)
  )),
  
  -- Target values
  target_value NUMERIC(10, 2) NOT NULL,  -- Valor alvo
  initial_value NUMERIC(10, 2),          -- Valor inicial (opcional, calculado automaticamente)
  current_value NUMERIC(10, 2),          -- Valor atual (calculado)
  
  -- Exercise ID (para metas de carga)
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT,  -- Nome do exercício (cache para performance)
  
  -- Circumference type (para metas de circunferência)
  circumference_type TEXT CHECK (circumference_type IN (
    'chest', 'waist', 'hip', 'arm', 'thigh', 'calf'
  )),
  
  -- Dates
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  completed_at DATE,  -- Quando foi atingida
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  
  -- Progress tracking
  progress_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.goals IS 'Metas/objetivos definidos pelo personal trainer para os alunos';
COMMENT ON COLUMN public.goals.goal_type IS 'Tipo de meta: peso, gordura, medidas, carga, frequência';
COMMENT ON COLUMN public.goals.target_value IS 'Valor alvo da meta';
COMMENT ON COLUMN public.goals.initial_value IS 'Valor inicial (baseado na primeira avaliação ou definido manualmente)';
COMMENT ON COLUMN public.goals.current_value IS 'Valor atual (calculado baseado na última avaliação ou treinos)';
COMMENT ON COLUMN public.goals.progress_percentage IS 'Percentual de progresso (0-100%)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_student_id ON public.goals(student_id);
CREATE INDEX IF NOT EXISTS idx_goals_personal_id ON public.goals(personal_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON public.goals(goal_type);

-- Function to calculate goal progress
CREATE OR REPLACE FUNCTION calculate_goal_progress(goal_record public.goals)
RETURNS NUMERIC(5, 2) AS $$
DECLARE
  progress NUMERIC(5, 2);
  initial_val NUMERIC(10, 2);
  current_val NUMERIC(10, 2);
  target_val NUMERIC(10, 2);
BEGIN
  initial_val := COALESCE(goal_record.initial_value, 0);
  current_val := COALESCE(goal_record.current_value, initial_val);
  target_val := goal_record.target_value;

  -- Se não tem valor inicial, não pode calcular progresso
  IF initial_val IS NULL OR initial_val = 0 THEN
    RETURN 0;
  END IF;

  -- Para metas de aumento (weight_gain, muscle_gain, circumference_increase, load_increase, workout_frequency)
  IF goal_record.goal_type IN ('weight_gain', 'muscle_gain', 'circumference_increase', 'load_increase', 'workout_frequency') THEN
    IF target_val <= initial_val THEN
      RETURN 0;
    END IF;
    progress := ((current_val - initial_val) / (target_val - initial_val)) * 100;
  -- Para metas de redução (weight_loss, fat_loss, circumference_reduction)
  ELSIF goal_record.goal_type IN ('weight_loss', 'fat_loss', 'circumference_reduction') THEN
    IF initial_val <= target_val THEN
      RETURN 100; -- Já atingiu a meta
    END IF;
    progress := ((initial_val - current_val) / (initial_val - target_val)) * 100;
  ELSE
    RETURN 0;
  END IF;

  -- Limitar entre 0 e 100
  progress := GREATEST(0, LEAST(100, progress));
  
  RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update goal current value and progress
CREATE OR REPLACE FUNCTION update_goal_from_assessment()
RETURNS TRIGGER AS $$
DECLARE
  goal_record RECORD;
  new_value NUMERIC(10, 2);
BEGIN
  -- Atualizar metas relacionadas a avaliações físicas quando uma nova avaliação é criada/atualizada
  
  -- Metas de peso
  FOR goal_record IN 
    SELECT * FROM public.goals 
    WHERE student_id = NEW.student_id 
      AND goal_type IN ('weight_loss', 'weight_gain')
      AND status = 'active'
  LOOP
    new_value := NEW.weight;
    IF new_value IS NOT NULL THEN
      UPDATE public.goals
      SET 
        current_value = new_value,
        progress_percentage = calculate_goal_progress(goals),
        updated_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  -- Metas de massa muscular
  FOR goal_record IN 
    SELECT * FROM public.goals 
    WHERE student_id = NEW.student_id 
      AND goal_type = 'muscle_gain'
      AND status = 'active'
  LOOP
    new_value := NEW.muscle_mass;
    IF new_value IS NOT NULL THEN
      UPDATE public.goals
      SET 
        current_value = new_value,
        progress_percentage = calculate_goal_progress(goals),
        updated_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  -- Metas de gordura corporal
  FOR goal_record IN 
    SELECT * FROM public.goals 
    WHERE student_id = NEW.student_id 
      AND goal_type = 'fat_loss'
      AND status = 'active'
  LOOP
    new_value := NEW.body_fat_percentage;
    IF new_value IS NOT NULL THEN
      UPDATE public.goals
      SET 
        current_value = new_value,
        progress_percentage = calculate_goal_progress(goals),
        updated_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  -- Metas de circunferência
  FOR goal_record IN 
    SELECT * FROM public.goals 
    WHERE student_id = NEW.student_id 
      AND goal_type IN ('circumference_reduction', 'circumference_increase')
      AND status = 'active'
      AND circumference_type IS NOT NULL
  LOOP
    CASE goal_record.circumference_type
      WHEN 'chest' THEN new_value := NEW.chest_circumference;
      WHEN 'waist' THEN new_value := NEW.waist_circumference;
      WHEN 'hip' THEN new_value := NEW.hip_circumference;
      WHEN 'arm' THEN new_value := NEW.arm_circumference;
      WHEN 'thigh' THEN new_value := NEW.thigh_circumference;
      WHEN 'calf' THEN new_value := NEW.calf_circumference;
      ELSE new_value := NULL;
    END CASE;

    IF new_value IS NOT NULL THEN
      UPDATE public.goals
      SET 
        current_value = new_value,
        progress_percentage = calculate_goal_progress(goals),
        updated_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar metas quando avaliação física é criada/atualizada
DROP TRIGGER IF EXISTS trigger_update_goals_from_assessment ON public.physical_assessments;
CREATE TRIGGER trigger_update_goals_from_assessment
AFTER INSERT OR UPDATE ON public.physical_assessments
FOR EACH ROW
EXECUTE FUNCTION update_goal_from_assessment();

-- Function to update goal from workout sessions (for load_increase and workout_frequency)
CREATE OR REPLACE FUNCTION update_goal_from_workout()
RETURNS TRIGGER AS $$
DECLARE
  goal_record RECORD;
  max_load NUMERIC(10, 2);
  workout_count INTEGER;
BEGIN
  -- Para metas de carga (load_increase)
  FOR goal_record IN 
    SELECT g.* FROM public.goals g
    JOIN public.students s ON s.id = g.student_id
    WHERE s.student_user_id = NEW.student_user_id
      AND g.goal_type = 'load_increase'
      AND g.exercise_id IS NOT NULL
      AND g.status = 'active'
  LOOP
    -- Buscar carga máxima deste exercício nas sessões completadas
    SELECT MAX(CAST(wse.actual_load AS NUMERIC))
    INTO max_load
    FROM public.workout_sessions ws
    JOIN public.workout_session_exercises wse ON wse.session_id = ws.id
    WHERE ws.student_user_id = NEW.student_user_id
      AND ws.status = 'completed'
      AND wse.exercise_id = goal_record.exercise_id
      AND wse.actual_load IS NOT NULL;

    IF max_load IS NOT NULL THEN
      UPDATE public.goals
      SET 
        current_value = max_load,
        progress_percentage = calculate_goal_progress(goals),
        updated_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  -- Para metas de frequência (workout_frequency)
  FOR goal_record IN 
    SELECT g.* FROM public.goals g
    JOIN public.students s ON s.id = g.student_id
    WHERE s.student_user_id = NEW.student_user_id
      AND g.goal_type = 'workout_frequency'
      AND g.status = 'active'
      AND DATE_TRUNC('month', NEW.session_date) = DATE_TRUNC('month', goal_record.target_date)
  LOOP
    -- Contar treinos completados no mês da meta
    SELECT COUNT(*)
    INTO workout_count
    FROM public.workout_sessions ws
    WHERE ws.student_user_id = NEW.student_user_id
      AND ws.status = 'completed'
      AND DATE_TRUNC('month', ws.session_date) = DATE_TRUNC('month', goal_record.target_date);

    IF workout_count > 0 THEN
      UPDATE public.goals
      SET 
        current_value = workout_count,
        progress_percentage = calculate_goal_progress(goals),
        updated_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar metas de carga/frequência quando treino é completado
DROP TRIGGER IF EXISTS trigger_update_goals_from_workout ON public.workout_sessions;
CREATE TRIGGER trigger_update_goals_from_workout
AFTER UPDATE OF status ON public.workout_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_goal_from_workout();

-- Function to check and mark goals as completed
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se progresso >= 100% e status é active, marcar como completed
  IF NEW.progress_percentage >= 100 AND NEW.status = 'active' THEN
    NEW.status := 'completed';
    NEW.completed_at := COALESCE(NEW.completed_at, CURRENT_DATE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar metas como completas
DROP TRIGGER IF EXISTS trigger_check_goal_completion ON public.goals;
CREATE TRIGGER trigger_check_goal_completion
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION check_goal_completion();

-- RLS Policies
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Personal trainers can view their students' goals
CREATE POLICY "Personal can view students goals"
ON public.goals FOR SELECT
USING (
  personal_id = auth.uid()
);

-- Personal trainers can create goals for their students
CREATE POLICY "Personal can create goals for students"
ON public.goals FOR INSERT
WITH CHECK (
  personal_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.students
    WHERE id = student_id
    AND personal_id = auth.uid()
  )
);

-- Personal trainers can update their students' goals
CREATE POLICY "Personal can update students goals"
ON public.goals FOR UPDATE
USING (
  personal_id = auth.uid()
);

-- Personal trainers can delete their students' goals
CREATE POLICY "Personal can delete students goals"
ON public.goals FOR DELETE
USING (
  personal_id = auth.uid()
);

-- Students can view their own goals
CREATE POLICY "Students can view own goals"
ON public.goals FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE student_user_id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Execute esta query para verificar se as tabelas foram criadas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goals';

