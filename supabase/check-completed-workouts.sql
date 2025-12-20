-- =====================================================
-- VERIFICAR E CORRIGIR TREINOS CONCLUÍDOS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para verificar se os treinos foram marcados como concluídos
-- =====================================================

-- PASSO 1: Ver todas as sessões do aluno
SELECT 
  ws.id,
  ws.session_date,
  ws.status,
  ws.completed_at,
  ws.duration_minutes,
  wt.name as template_name,
  COUNT(wse.id) as exercise_count
FROM public.workout_sessions ws
LEFT JOIN public.workout_templates wt ON wt.id = ws.template_id
LEFT JOIN public.workout_session_exercises wse ON wse.session_id = ws.id
WHERE ws.student_user_id = (
  SELECT id FROM auth.users WHERE email = 'galordyy@gmail.com' LIMIT 1
)
GROUP BY ws.id, ws.session_date, ws.status, ws.completed_at, ws.duration_minutes, wt.name
ORDER BY ws.session_date DESC, ws.completed_at DESC;

-- PASSO 2: Verificar sessões que deveriam estar concluídas mas não estão
SELECT 
  ws.id,
  ws.session_date,
  ws.status,
  ws.completed_at,
  COUNT(wse.id) as exercise_count,
  SUM(CASE WHEN wse.actual_sets > 0 OR wse.actual_reps != '' THEN 1 ELSE 0 END) as filled_exercises
FROM public.workout_sessions ws
LEFT JOIN public.workout_session_exercises wse ON wse.session_id = ws.id
WHERE ws.student_user_id = (
  SELECT id FROM auth.users WHERE email = 'galordyy@gmail.com' LIMIT 1
)
AND ws.status = 'in_progress'
GROUP BY ws.id, ws.session_date, ws.status, ws.completed_at
HAVING COUNT(wse.id) > 0
  AND SUM(CASE WHEN wse.actual_sets > 0 OR wse.actual_reps != '' THEN 1 ELSE 0 END) = COUNT(wse.id);

-- PASSO 3: Marcar como concluído manualmente (se necessário)
-- Descomente e ajuste o ID da sessão se precisar forçar a conclusão
/*
UPDATE public.workout_sessions
SET 
  status = 'completed',
  completed_at = COALESCE(completed_at, NOW()),
  duration_minutes = COALESCE(
    duration_minutes,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60
  )
WHERE id = 'ID_DA_SESSAO_AQUI'
  AND status = 'in_progress';
*/

-- PASSO 4: Verificar sessões concluídas que aparecem no histórico
SELECT 
  ws.id,
  ws.session_date,
  ws.status,
  ws.completed_at,
  wt.name as template_name,
  COUNT(wse.id) as exercise_count
FROM public.workout_sessions ws
LEFT JOIN public.workout_templates wt ON wt.id = ws.template_id
LEFT JOIN public.workout_session_exercises wse ON wse.session_id = ws.id
WHERE ws.student_user_id = (
  SELECT id FROM auth.users WHERE email = 'galordyy@gmail.com' LIMIT 1
)
AND ws.status = 'completed'
AND ws.session_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY ws.id, ws.session_date, ws.status, ws.completed_at, wt.name
ORDER BY ws.session_date DESC, ws.completed_at DESC;



