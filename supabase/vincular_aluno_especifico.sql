-- =====================================================
-- Script para Vincular um Aluno Específico
-- =====================================================
-- 
-- Substitua o EMAIL_DO_ALUNO pelo email do aluno que você quer vincular
--

-- Substitua este email pelo email do aluno
\set aluno_email 'Eduardo.sorrentino5@gmail.com'

-- 1. Ver se o usuário existe
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at
FROM auth.users u
WHERE LOWER(u.email) = LOWER(:'aluno_email');

-- 2. Ver informações do aluno
SELECT 
    s.id,
    s.student_name,
    s.student_email,
    s.status,
    s.student_user_id,
    s.personal_id
FROM students s
WHERE LOWER(s.student_email) = LOWER(:'aluno_email');

-- 3. Vincular se o usuário existir e estiver confirmado
UPDATE students s
SET 
    student_user_id = u.id,
    status = 'active',
    updated_at = NOW()
FROM auth.users u
WHERE 
    LOWER(s.student_email) = LOWER(:'aluno_email')
    AND LOWER(u.email) = LOWER(:'aluno_email')
    AND s.student_user_id IS NULL
    AND u.email_confirmed_at IS NOT NULL
RETURNING 
    s.student_name,
    s.student_email,
    '✅ Aluno vinculado com sucesso!' as resultado;

-- =====================================================
-- Para usar com um email específico, execute:
-- =====================================================
-- 
-- \set aluno_email 'email@exemplo.com'
-- \i vincular_aluno_especifico.sql
--
-- OU simplesmente substitua 'Eduardo.sorrentino5@gmail.com'
-- pelo email desejado e execute a query #3
--

