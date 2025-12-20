-- =====================================================
-- CORRIGIR CONSTRAINT DE STATUS NA TABELA workout_sessions
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para garantir que o status aceita 'completed' em vez de 'done'
-- =====================================================

-- PASSO 1: Verificar constraint atual
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.workout_sessions'::regclass
  AND conname LIKE '%status%';

-- PASSO 2: Remover constraint antiga se existir
ALTER TABLE public.workout_sessions 
DROP CONSTRAINT IF EXISTS workout_sessions_status_check;

-- PASSO 3: Criar constraint correta
ALTER TABLE public.workout_sessions 
ADD CONSTRAINT workout_sessions_status_check 
CHECK (status IN ('in_progress', 'completed'));

-- PASSO 4: Verificar se foi criada corretamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.workout_sessions'::regclass
  AND conname = 'workout_sessions_status_check';

-- PASSO 5: Atualizar sessões antigas que usam 'done' para 'completed'
UPDATE public.workout_sessions
SET status = 'completed'
WHERE status = 'done';

-- PASSO 6: Verificar resultado
SELECT 
  status,
  COUNT(*) as count
FROM public.workout_sessions
GROUP BY status;

