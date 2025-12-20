-- Script para ativar um aluno específico pelo email
-- Substitua 'email@exemplo.com' pelo email do aluno que deseja ativar
-- IMPORTANTE: Cria o profile primeiro se não existir

-- PASSO 1: Criar profile se não existir
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
WHERE LOWER(TRIM(s.student_email)) = LOWER(TRIM('email@exemplo.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- PASSO 2: Ativar aluno vinculando ao profile
UPDATE public.students s
SET 
  student_user_id = u.id,
  status = 'active'
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('email@exemplo.com'))
  AND LOWER(TRIM(s.student_email)) = LOWER(TRIM('email@exemplo.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL
  AND u.id IS NOT NULL;

-- Verificar se foi atualizado
SELECT 
  id,
  student_name,
  student_email,
  status,
  student_user_id,
  created_at
FROM public.students
WHERE LOWER(TRIM(student_email)) = LOWER(TRIM('email@exemplo.com'));

-- ============================================
-- EXEMPLOS DE USO:
-- ============================================

-- ============================================
-- EXEMPLOS PRONTOS PARA USAR:
-- ============================================

-- Para Eduardo Rato (descomente e execute):
/*
-- Criar profile primeiro
INSERT INTO public.profiles (id, role, name)
SELECT 
  u.id,
  'student' as role,
  COALESCE(s.student_name, SPLIT_PART(u.email, '@', 1)) as name
FROM auth.users u
INNER JOIN public.students s ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
WHERE LOWER(TRIM(s.student_email)) = LOWER(TRIM('Eduardo.sorrentino5@gmail.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Ativar aluno
UPDATE public.students s
SET student_user_id = u.id, status = 'active'
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('Eduardo.sorrentino5@gmail.com'))
  AND LOWER(TRIM(s.student_email)) = LOWER(TRIM('Eduardo.sorrentino5@gmail.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL;
*/

-- Para Hugo Matheus (descomente e execute):
/*
-- Criar profile primeiro
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

-- Ativar aluno
UPDATE public.students s
SET student_user_id = u.id, status = 'active'
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('hugomatheus210900@gmail.com'))
  AND LOWER(TRIM(s.student_email)) = LOWER(TRIM('hugomatheus210900@gmail.com'))
  AND s.status = 'invited'
  AND s.student_user_id IS NULL;
*/

