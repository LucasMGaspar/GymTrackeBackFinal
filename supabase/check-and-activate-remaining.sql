-- Script para verificar e ativar alunos que ainda estão como 'invited'
-- Este script mostra quais alunos ainda não foram ativados e tenta ativá-los

-- Ver alunos que ainda estão como 'invited' e verificar se têm usuário no auth
SELECT 
  s.id,
  s.student_name,
  s.student_email,
  s.status,
  s.student_user_id,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Tem usuário no auth'
    ELSE '❌ NÃO tem usuário no auth'
  END as auth_status,
  u.id as auth_user_id,
  u.email as auth_email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Tem profile'
    ELSE '❌ NÃO tem profile'
  END as profile_status
FROM public.students s
LEFT JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
LEFT JOIN public.profiles p ON p.id = u.id
WHERE s.status = 'invited'
  AND s.student_user_id IS NULL
ORDER BY s.created_at DESC;

-- Tentar ativar os que têm usuário mas ainda não foram ativados
-- PASSO 1: Criar profiles para usuários que não têm profile ainda
INSERT INTO public.profiles (id, role, name)
SELECT 
  u.id,
  'student' as role,
  COALESCE(
    s.student_name,
    SPLIT_PART(u.email, '@', 1)
  ) as name
FROM auth.users u
INNER JOIN public.students s ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
WHERE s.status = 'invited'
  AND s.student_user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- PASSO 2: Atualizar alunos vinculando-os aos profiles
UPDATE public.students s
SET 
  student_user_id = u.id,
  status = 'active'
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL
  AND u.id IS NOT NULL;

-- Verificar resultado final
SELECT 
  id,
  student_name,
  student_email,
  status,
  student_user_id,
  created_at
FROM public.students
WHERE status = 'invited'
ORDER BY created_at DESC;

