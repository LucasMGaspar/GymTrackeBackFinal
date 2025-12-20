-- =====================================================
-- Script Completo: Criar Usuários e Vincular Alunos
-- =====================================================
-- 
-- ATENÇÃO: Este script cria usuários no auth.users
-- Use com cuidado! Recomendado para casos específicos.
--

-- =====================================================
-- PARTE 1: Ver situação atual
-- =====================================================

SELECT 
    s.id as student_id,
    s.student_name,
    s.student_email,
    s.status,
    s.student_user_id,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ Usuário já existe'
        ELSE '❌ Usuário não existe'
    END as situacao
FROM students s
LEFT JOIN auth.users u ON LOWER(u.email) = LOWER(s.student_email)
WHERE s.student_user_id IS NULL
ORDER BY s.created_at DESC;

-- =====================================================
-- PARTE 2: Vincular alunos que JÁ TÊM usuário
-- =====================================================

UPDATE students s
SET 
    student_user_id = u.id,
    status = 'active',
    updated_at = NOW()
FROM auth.users u
WHERE 
    s.student_user_id IS NULL
    AND LOWER(s.student_email) = LOWER(u.email)
    AND u.email_confirmed_at IS NOT NULL
RETURNING 
    s.student_name,
    s.student_email,
    '✅ Vincular: ' || s.student_name as resultado;

-- =====================================================
-- PARTE 3: Criar usuários para alunos que NÃO TÊM
-- =====================================================
-- 
-- ⚠️ ATENÇÃO: Criar usuários diretamente não envia email de confirmação
-- Recomendado: Use a interface para enviar convites (melhor UX)
--

-- Descomente abaixo se quiser criar usuários automaticamente
-- (NÃO RECOMENDADO - melhor enviar convite pela interface)

/*
DO $$
DECLARE
    student_record RECORD;
    new_user_id UUID;
BEGIN
    -- Para cada aluno sem usuário
    FOR student_record IN 
        SELECT s.id, s.student_name, s.student_email, s.personal_id
        FROM students s
        WHERE s.student_user_id IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE LOWER(u.email) = LOWER(s.student_email)
        )
    LOOP
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        )
        VALUES (
            gen_random_uuid(),
            student_record.student_email,
            crypt(gen_random_uuid()::text, gen_salt('bf')), -- Senha aleatória (precisa redefinir depois)
            NOW(), -- Marcar como confirmado
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"name":"' || student_record.student_name || '"}'::jsonb,
            false,
            'authenticated'
        )
        RETURNING id INTO new_user_id;

        -- Vincular aluno ao usuário
        UPDATE students
        SET 
            student_user_id = new_user_id,
            status = 'active',
            updated_at = NOW()
        WHERE id = student_record.id;

        RAISE NOTICE 'Usuário criado e aluno vinculado: % (%)', student_record.student_name, student_record.student_email;
    END LOOP;
END $$;
*/

-- =====================================================
-- MÉTODO RECOMENDADO: Usar a interface
-- =====================================================
--
-- Para alunos que não têm usuário, o melhor é:
-- 1. Vá na interface: /app/personal/students
-- 2. Clique em "Reenviar Convite" ou gere novo link
-- 3. Envie o link manualmente para o aluno
-- 4. Quando o aluno clicar, o usuário será criado automaticamente
--
-- =====================================================

