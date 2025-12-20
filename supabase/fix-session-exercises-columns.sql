-- =====================================================
-- CORRIGIR COLUNAS target_sets E target_reps NA TABELA workout_session_exercises
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para garantir que as colunas target_sets e target_reps existem
-- =====================================================

-- PASSO 1: Verificar colunas existentes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workout_session_exercises'
  AND column_name IN ('target_sets', 'target_reps');

-- PASSO 2: Adicionar target_sets se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_session_exercises'
      AND column_name = 'target_sets'
  ) THEN
    ALTER TABLE public.workout_session_exercises
    ADD COLUMN target_sets INT;
    
    RAISE NOTICE '✅ Coluna target_sets criada!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna target_sets já existe.';
  END IF;
END $$;

-- PASSO 3: Adicionar target_reps se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_session_exercises'
      AND column_name = 'target_reps'
  ) THEN
    ALTER TABLE public.workout_session_exercises
    ADD COLUMN target_reps TEXT;
    
    RAISE NOTICE '✅ Coluna target_reps criada!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna target_reps já existe.';
  END IF;
END $$;

-- PASSO 4: Verificar novamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workout_session_exercises'
  AND column_name IN ('target_sets', 'target_reps');

-- PASSO 5: Forçar atualização do schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Após executar este script, aguarde alguns segundos
-- 2. Recarregue a página do aplicativo
-- 3. Se o erro persistir, aguarde 1-2 minutos para o cache atualizar

