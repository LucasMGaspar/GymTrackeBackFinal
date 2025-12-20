-- =====================================================
-- SCRIPT PARA RECRIAR USUÁRIO PERSONAL TRAINER
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'SEU-EMAIL@example.com' pelo seu email
-- 2. Substitua 'Seu Nome' pelo seu nome
-- 3. Execute o script completo
-- =====================================================

-- PASSO 1: Verificar se já existe um usuário com este email
DO $$
DECLARE
  user_email TEXT := 'SEU-EMAIL@example.com';  -- ⚠️ ALTERE AQUI
  user_name TEXT := 'Seu Nome';  -- ⚠️ ALTERE AQUI
  existing_user_id UUID;
  new_user_id UUID;
BEGIN
  -- Verificar se usuário já existe no auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = user_email;

  IF existing_user_id IS NOT NULL THEN
    -- Usuário já existe, vamos usar ele
    RAISE NOTICE 'Usuário já existe com ID: %', existing_user_id;
    new_user_id := existing_user_id;
    
    -- Verificar se já tem profile
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = existing_user_id) THEN
      -- Atualizar para personal se não for
      UPDATE public.profiles
      SET role = 'personal', name = user_name
      WHERE id = existing_user_id;
      RAISE NOTICE 'Profile atualizado para personal trainer';
    ELSE
      -- Criar profile
      INSERT INTO public.profiles (id, role, name)
      VALUES (existing_user_id, 'personal', user_name);
      RAISE NOTICE 'Profile criado como personal trainer';
    END IF;
  ELSE
    -- Criar novo usuário no auth.users
    -- NOTA: Você precisa criar o usuário manualmente via Supabase Auth UI
    -- ou usar a API. Este script apenas cria o profile.
    RAISE EXCEPTION 'Usuário não encontrado no auth.users. Crie o usuário primeiro via login ou API.';
  END IF;

  RAISE NOTICE '✅ Usuário personal trainer configurado com sucesso!';
  RAISE NOTICE 'ID do usuário: %', new_user_id;
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Nome: %', user_name;
  RAISE NOTICE 'Role: personal';
END $$;

-- =====================================================
-- ALTERNATIVA: Se você já tem o ID do usuário
-- =====================================================
-- Se você sabe o UUID do seu usuário, use este script:

/*
-- Substitua 'SEU-USER-ID-AQUI' pelo UUID do seu usuário
INSERT INTO public.profiles (id, role, name)
VALUES ('SEU-USER-ID-AQUI', 'personal', 'Seu Nome')
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Seu Nome';
*/

-- =====================================================
-- VERIFICAR SE FUNCIONOU
-- =====================================================
-- Execute esta query para verificar:

SELECT 
  p.id,
  p.name,
  p.role,
  u.email,
  u.email_confirmed_at,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'personal'
ORDER BY p.created_at DESC;





