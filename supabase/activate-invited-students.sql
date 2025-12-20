-- Script para ativar alunos convidados vinculando-os aos usuários do auth
-- Este script encontra alunos com status 'invited' e student_user_id NULL
-- e os vincula aos usuários correspondentes no auth.users pelo email
-- IMPORTANTE: Cria o profile primeiro se não existir, pois student_user_id referencia profiles.id

-- Ver alunos pendentes antes da atualização
SELECT 
  s.id,
  s.student_name,
  s.student_email,
  s.status,
  s.student_user_id,
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as profile_exists
FROM public.students s
LEFT JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
LEFT JOIN public.profiles p ON p.id = u.id
WHERE s.status = 'invited'
  AND s.student_user_id IS NULL;

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

-- PASSO 2: Atualizar alunos vinculando-os aos profiles (que agora existem)
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

-- Verificar resultado após atualização
SELECT 
  id,
  student_name,
  student_email,
  status,
  student_user_id,
  created_at
FROM public.students
WHERE status IN ('invited', 'active')
ORDER BY created_at DESC;

-- Se algum aluno ainda estiver como 'invited' sem user_id,
-- significa que o usuário ainda não fez login/registro no sistema
-- Esses alunos serão vinculados automaticamente quando fizerem login pela primeira vez

