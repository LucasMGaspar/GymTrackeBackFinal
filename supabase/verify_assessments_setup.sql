-- =====================================================
-- VERIFY AND FIX PHYSICAL ASSESSMENTS SETUP
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar se a tabela existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'physical_assessments')
    THEN '✅ Tabela physical_assessments existe'
    ELSE '❌ Tabela physical_assessments NÃO existe'
  END AS status;

-- 2. Verificar se RLS está habilitado
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'physical_assessments'
      AND rowsecurity = true
    )
    THEN '✅ RLS está habilitado'
    ELSE '❌ RLS NÃO está habilitado'
  END AS rls_status;

-- 3. Verificar políticas RLS existentes
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
WHERE tablename = 'physical_assessments'
ORDER BY policyname;

-- 4. Se não houver políticas, criar todas elas
DO $$
BEGIN
  -- Verificar e criar política SELECT para personal trainers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'physical_assessments' 
    AND policyname = 'Personal trainers can view their students'' assessments'
  ) THEN
    CREATE POLICY "Personal trainers can view their students' assessments"
      ON public.physical_assessments FOR SELECT
      USING (personal_id = auth.uid());
    RAISE NOTICE '✅ Política SELECT para personal trainers criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política SELECT para personal trainers já existe';
  END IF;

  -- Verificar e criar política INSERT para personal trainers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'physical_assessments' 
    AND policyname = 'Personal trainers can create assessments for their students'
  ) THEN
    CREATE POLICY "Personal trainers can create assessments for their students"
      ON public.physical_assessments FOR INSERT
      WITH CHECK (
        personal_id = auth.uid() 
        AND student_id IN (
          SELECT id FROM public.students WHERE personal_id = auth.uid()
        )
        AND created_by = auth.uid()
      );
    RAISE NOTICE '✅ Política INSERT para personal trainers criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política INSERT para personal trainers já existe';
  END IF;

  -- Verificar e criar política UPDATE para personal trainers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'physical_assessments' 
    AND policyname = 'Personal trainers can update their students'' assessments'
  ) THEN
    CREATE POLICY "Personal trainers can update their students' assessments"
      ON public.physical_assessments FOR UPDATE
      USING (personal_id = auth.uid())
      WITH CHECK (personal_id = auth.uid());
    RAISE NOTICE '✅ Política UPDATE para personal trainers criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política UPDATE para personal trainers já existe';
  END IF;

  -- Verificar e criar política DELETE para personal trainers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'physical_assessments' 
    AND policyname = 'Personal trainers can delete their students'' assessments'
  ) THEN
    CREATE POLICY "Personal trainers can delete their students' assessments"
      ON public.physical_assessments FOR DELETE
      USING (personal_id = auth.uid());
    RAISE NOTICE '✅ Política DELETE para personal trainers criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política DELETE para personal trainers já existe';
  END IF;

  -- Verificar e criar política SELECT para alunos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'physical_assessments' 
    AND policyname = 'Students can view their own assessments'
  ) THEN
    CREATE POLICY "Students can view their own assessments"
      ON public.physical_assessments FOR SELECT
      USING (
        student_id IN (
          SELECT id FROM public.students WHERE student_user_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ Política SELECT para alunos criada';
  ELSE
    RAISE NOTICE 'ℹ️ Política SELECT para alunos já existe';
  END IF;

  -- Garantir que RLS está habilitado
  ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS habilitado na tabela';
END $$;

-- 5. Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'physical_assessments'
ORDER BY trigger_name;

-- 6. Verificar função calculate_bmi
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'calculate_bmi'
    )
    THEN '✅ Função calculate_bmi existe'
    ELSE '❌ Função calculate_bmi NÃO existe'
  END AS function_status;

-- 7. Resumo final
SELECT 
  'Verificação concluída!' AS status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'physical_assessments') AS total_policies,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'physical_assessments') AS total_triggers;

