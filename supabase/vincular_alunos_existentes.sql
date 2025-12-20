-- =====================================================
-- Script para Vincular Alunos Existentes aos Usuários
-- =====================================================
-- 
-- Este script verifica alunos com student_user_id = NULL
-- e tenta vinculá-los a usuários existentes no auth.users
-- pelo email, ou lista os que precisam ser criados manualmente
--

-- 1. Ver alunos que precisam de vinculação
SELECT 
    s.id,
    s.student_name,
    s.student_email,
    s.status,
    CASE 
        WHEN u.id IS NOT NULL THEN 'Usuário existe - pode vincular'
        ELSE 'Usuário não existe - precisa criar'
    END as situacao,
    u.id as user_id_existente
FROM students s
LEFT JOIN auth.users u ON LOWER(u.email) = LOWER(s.student_email)
WHERE s.student_user_id IS NULL
ORDER BY s.created_at DESC;

-- 2. Vincular alunos que já têm usuário criado no auth.users
UPDATE students s
SET 
    student_user_id = u.id,
    status = 'active',
    updated_at = NOW()
FROM auth.users u
WHERE 
    s.student_user_id IS NULL
    AND LOWER(s.student_email) = LOWER(u.email)
    AND u.email_confirmed_at IS NOT NULL  -- Só vincula se email confirmado
RETURNING 
    s.id,
    s.student_name,
    s.student_email,
    'Vincular: ' || s.student_name as resultado;

-- 3. Ver alunos que ainda não têm usuário criado
-- (Esses precisarão receber um novo convite)
SELECT 
    s.id,
    s.student_name,
    s.student_email,
    s.status,
    'Necessita novo convite - usuário não existe no auth.users' as situacao
FROM students s
LEFT JOIN auth.users u ON LOWER(u.email) = LOWER(s.student_email)
WHERE 
    s.student_user_id IS NULL
    AND u.id IS NULL
ORDER BY s.created_at DESC;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
--
-- 1. Execute primeiro a query #1 para VER quais alunos precisam de vinculação
-- 2. Se houver alunos com "Usuário existe", execute a query #2 para VINCULAR
-- 3. Se houver alunos com "Usuário não existe", você precisará:
--    - Enviar um novo convite pela interface
--    - OU criar usuário manualmente via Supabase Dashboard
--
-- =====================================================

