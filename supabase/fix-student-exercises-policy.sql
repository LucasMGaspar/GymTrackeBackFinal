-- =====================================================
-- CORRIGIR POLÍTICA RLS PARA ALUNOS VEREM EXERCÍCIOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para permitir que alunos vejam os exercícios dos seus treinos
-- =====================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Students can view exercises in their workouts" ON public.exercises;

-- Criar política para alunos verem exercícios que estão nos seus templates ou sessões
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
-- VERIFICAR SE A POLÍTICA FOI CRIADA
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'exercises'
  AND policyname = 'Students can view exercises in their workouts';



