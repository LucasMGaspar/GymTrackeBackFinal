-- Script para verificar se Hugo Matheus tem usuário no auth.users
-- e tentar ativá-lo se possível

-- Verificar se Hugo Matheus tem usuário no auth.users
SELECT 
  'Verificação de Hugo Matheus' as info,
  s.id as student_id,
  s.student_name,
  s.student_email,
  s.status,
  s.student_user_id,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ TEM usuário no auth.users'
    ELSE '❌ NÃO TEM usuário no auth.users - precisa fazer login primeiro'
  END as auth_status,
  u.id as auth_user_id,
  u.email as auth_email,
  u.created_at as auth_user_created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ TEM profile'
    ELSE '❌ NÃO TEM profile'
  END as profile_status
FROM public.students s
LEFT JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
LEFT JOIN public.profiles p ON p.id = u.id
WHERE LOWER(TRIM(s.student_email)) = LOWER(TRIM('hugomatheus210900@gmail.com'));

-- Se o usuário EXISTIR no auth.users, tentar ativar:
-- PASSO 1: Criar profile se não existir
INSERT INTO public.profiles (id, role, name)
SELECT 
  u.id,
  'student' as role,
  COALESCE(s.student_name, SPLIT_PART(u.email, '@', 1)) as name
FROM auth.users u
INNER JOIN public.students s ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
WHERE LOWER(TRIM(s.student_email)) = LOWER(TRIM('hugomatheus210900@gmail.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- PASSO 2: Ativar aluno vinculando ao profile
UPDATE public.students s
SET 
  student_user_id = u.id,
  status = 'active'
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('hugomatheus210900@gmail.com'))
  AND LOWER(TRIM(s.student_email)) = LOWER(TRIM('hugomatheus210900@gmail.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL;

-- Verificar resultado final
SELECT 
  'Resultado Final' as info,
  id,
  student_name,
  student_email,
  status,
  student_user_id,
  created_at
FROM public.students
WHERE LOWER(TRIM(student_email)) = LOWER(TRIM('hugomatheus210900@gmail.com'));

