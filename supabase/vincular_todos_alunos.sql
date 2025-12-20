-- =====================================================
-- Script Simples: Vincular Todos os Alunos Possíveis
-- =====================================================
-- 
-- Este script tenta vincular TODOS os alunos que têm
-- um usuário correspondente no auth.users
--

BEGIN;

-- Vincular todos os alunos que já têm usuário criado e confirmado
UPDATE students s
SET 
    student_user_id = u.id,
    status = CASE 
        WHEN s.status = 'invited' THEN 'active'
        ELSE s.status
    END,
    updated_at = NOW()
FROM auth.users u
WHERE 
    s.student_user_id IS NULL
    AND LOWER(s.student_email) = LOWER(u.email)
    AND u.email_confirmed_at IS NOT NULL;

-- Mostrar resultado
SELECT 
    COUNT(*) as total_vinculados,
    'Alunos vinculados com sucesso!' as mensagem
FROM students s
INNER JOIN auth.users u ON s.student_user_id = u.id
WHERE s.student_user_id IS NOT NULL;

-- Mostrar alunos que ainda não têm usuário
SELECT 
    s.id,
    s.student_name,
    s.student_email,
    s.status,
    '❌ Usuário não existe - precisa enviar convite' as situacao
FROM students s
WHERE s.student_user_id IS NULL
ORDER BY s.created_at DESC;

COMMIT;

-- =====================================================
-- RESULTADO:
-- =====================================================
-- 
-- Este script irá:
-- 1. Vincular todos os alunos que já têm usuário no auth.users
-- 2. Mudar status de 'invited' para 'active' quando vinculado
-- 3. Listar alunos que ainda precisam de convite
--
-- Para alunos que aparecerem como "precisa enviar convite",
-- use a interface para gerar novo link de convite
--

