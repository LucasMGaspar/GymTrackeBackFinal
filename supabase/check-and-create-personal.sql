-- =====================================================
-- VERIFICAR E CRIAR USUÁRIO PERSONAL TRAINER
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- PASSO 1: Verificar se a tabela profiles existe
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- PASSO 2: Ver todos os usuários no auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASSO 3: Ver todos os profiles existentes
SELECT 
  p.id,
  p.name,
  p.role,
  u.email,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;

-- =====================================================
-- CRIAR USUÁRIO PERSONAL (ESCOLHA UMA OPÇÃO)
-- =====================================================

-- OPÇÃO A: Se você JÁ TEM um usuário no auth.users
-- (Substitua 'SEU-EMAIL@example.com' pelo seu email)

DO $$
DECLARE
  user_email TEXT := 'SEU-EMAIL@example.com';  -- ⚠️ ALTERE AQUI
  user_name TEXT := 'Seu Nome';                -- ⚠️ ALTERE AQUI
  found_user_id UUID;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email;

  IF found_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado no auth.users! Email: %', user_email;
  END IF;

  -- Criar ou atualizar profile
  INSERT INTO public.profiles (id, role, name)
  VALUES (found_user_id, 'personal', user_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'personal',
    name = user_name;

  RAISE NOTICE '✅ Profile criado/atualizado!';
  RAISE NOTICE 'ID: %', found_user_id;
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Role: personal';
END $$;

-- OPÇÃO B: Se você SABE o UUID do usuário
-- (Substitua 'SEU-UUID-AQUI' pelo UUID do seu usuário)

/*
INSERT INTO public.profiles (id, role, name)
VALUES (
  'SEU-UUID-AQUI',  -- ⚠️ Cole o UUID aqui
  'personal',
  'Seu Nome'        -- ⚠️ Seu nome
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Seu Nome';
*/

-- =====================================================
-- VERIFICAR SE FUNCIONOU
-- =====================================================

SELECT 
  p.id,
  p.name,
  p.role,
  u.email,
  u.email_confirmed_at,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'personal';




