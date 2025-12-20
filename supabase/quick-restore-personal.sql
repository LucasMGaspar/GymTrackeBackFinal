-- =====================================================
-- SCRIPT RÁPIDO - RECRIAR PERSONAL TRAINER
-- =====================================================
-- 
-- MÉTODO MAIS FÁCIL:
-- 1. Faça login na aplicação com seu email
-- 2. Isso criará o usuário no auth.users automaticamente
-- 3. Execute este script substituindo o email abaixo
-- =====================================================

-- PASSO 1: Encontre seu user_id pelo email
-- (Execute esta query primeiro para pegar o ID)

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'SEU-EMAIL@example.com';  -- ⚠️ ALTERE AQUI

-- PASSO 2: Copie o ID que apareceu acima e cole aqui
-- Depois execute este INSERT:

/*
INSERT INTO public.profiles (id, role, name)
VALUES (
  'COLE-O-ID-AQUI',  -- ⚠️ Cole o ID do passo 1
  'personal',
  'Seu Nome'  -- ⚠️ Seu nome
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Seu Nome';
*/

-- =====================================================
-- OU: TUDO EM UM SCRIPT (se você já tem o email)
-- =====================================================

DO $$
DECLARE
  user_email TEXT := 'SEU-EMAIL@example.com';  -- ⚠️ ALTERE AQUI
  user_name TEXT := 'Seu Nome';  -- ⚠️ ALTERE AQUI
  found_user_id UUID;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email;

  IF found_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado! Faça login primeiro na aplicação para criar o usuário.';
  END IF;

  -- Criar ou atualizar profile
  INSERT INTO public.profiles (id, role, name)
  VALUES (found_user_id, 'personal', user_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'personal',
    name = user_name;

  RAISE NOTICE '✅ Personal trainer criado/atualizado com sucesso!';
  RAISE NOTICE 'ID: %', found_user_id;
  RAISE NOTICE 'Email: %', user_email;
END $$;





