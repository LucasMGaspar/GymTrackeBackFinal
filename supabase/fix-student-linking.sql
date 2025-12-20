-- =====================================================
-- CORRIGIR VINCULAÇÃO DE ALUNOS EXISTENTES
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para vincular alunos que já têm usuário mas não foram vinculados
-- =====================================================

-- PASSO 1: Ver alunos sem user_id vinculado
SELECT 
  s.id,
  s.student_name,
  s.student_email,
  s.status,
  u.id as user_id,
  u.email as user_email
FROM public.students s
LEFT JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.student_email))
WHERE s.student_user_id IS NULL
  AND s.status = 'invited'
ORDER BY s.created_at DESC;

-- =====================================================
-- PASSO 2: Vincular automaticamente
-- =====================================================

UPDATE public.students s
SET 
  student_user_id = u.id,
  status = 'active'
FROM auth.users u
WHERE LOWER(TRIM(s.student_email)) = LOWER(TRIM(u.email))
  AND s.student_user_id IS NULL
  AND s.status = 'invited'
  AND u.email_confirmed_at IS NOT NULL;

-- =====================================================
-- PASSO 3: Verificar resultado
-- =====================================================

SELECT 
  s.id,
  s.student_name,
  s.student_email,
  s.status,
  s.student_user_id,
  u.email as user_email_linked
FROM public.students s
LEFT JOIN auth.users u ON u.id = s.student_user_id
WHERE s.status = 'invited' OR s.status = 'active'
ORDER BY s.created_at DESC;

-- =====================================================
-- VERIFICAR SE A TRIGGER ESTÁ CRIADA
-- =====================================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- RECRIAR A TRIGGER SE NECESSÁRIO
-- =====================================================

-- Função para vincular aluno automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a pending student invitation for this email
  UPDATE public.students
  SET 
    student_user_id = NEW.id,
    status = 'active'
  WHERE LOWER(TRIM(student_email)) = LOWER(TRIM(NEW.email))
    AND status = 'invited'
    AND student_user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VINCULAR MANUALMENTE ALUNOS ESPECÍFICOS
-- =====================================================

-- Para luanferrati12@gmail.com
-- (Substitua o ID do aluno e do usuário pelos corretos)

/*
UPDATE public.students
SET 
  student_user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'luanferrati12@gmail.com' 
    LIMIT 1
  ),
  status = 'active'
WHERE student_email = 'luanferrati12@gmail.com'
  AND student_user_id IS NULL;
*/

-- Para galordyy@gmail.com
/*
UPDATE public.students
SET 
  student_user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'galordyy@gmail.com' 
    LIMIT 1
  ),
  status = 'active'
WHERE student_email = 'galordyy@gmail.com'
  AND student_user_id IS NULL;
*/


