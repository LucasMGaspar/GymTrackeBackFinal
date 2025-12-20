-- =====================================================
-- CORRIGIR COLUNA template_id NA TABELA workout_sessions
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para garantir que a coluna template_id existe
-- =====================================================

-- PASSO 1: Verificar se a coluna existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workout_sessions'
  AND column_name = 'template_id';

-- PASSO 2: Se não existir, criar a coluna
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_sessions'
      AND column_name = 'template_id'
  ) THEN
    -- Adicionar a coluna
    ALTER TABLE public.workout_sessions
    ADD COLUMN template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Coluna template_id criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna template_id já existe.';
  END IF;
END $$;

-- PASSO 3: Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_workout_sessions_template_id 
ON public.workout_sessions(template_id);

-- PASSO 4: Verificar novamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workout_sessions'
  AND column_name = 'template_id';

-- PASSO 5: Forçar atualização do schema cache do PostgREST
-- Isso pode ajudar a atualizar o cache imediatamente
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Após executar este script, aguarde alguns segundos
-- 2. Se o erro persistir, tente:
--    - Recarregar a página do aplicativo
--    - Fazer logout e login novamente
--    - Aguardar 1-2 minutos para o cache atualizar
-- 3. Se ainda não funcionar, verifique se a tabela
--    workout_templates existe e tem a coluna id

