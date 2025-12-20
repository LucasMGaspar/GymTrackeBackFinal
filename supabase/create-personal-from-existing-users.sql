-- =====================================================
-- CRIAR PERSONAL TRAINER A PARTIR DOS USUÁRIOS EXISTENTES
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- OPÇÃO 1: Criar personal trainer para lucasmanoel.g.g@gmail.com
-- (ID: cc661548-ff37-4b29-90e8-61daf5af3a69)

INSERT INTO public.profiles (id, role, name)
VALUES (
  'cc661548-ff37-4b29-90e8-61daf5af3a69',  -- ID do usuário
  'personal',
  'Lucas Manoel'  -- ⚠️ Altere o nome se necessário
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Lucas Manoel';

-- =====================================================
-- OU: Criar para outro usuário
-- =====================================================

-- OPÇÃO 2: Para lucasmanoe.g.g@gmail.com
-- (ID: 4d6ccdd6-9230-4001-9e3f-59b7490e16d9)
/*
INSERT INTO public.profiles (id, role, name)
VALUES (
  '4d6ccdd6-9230-4001-9e3f-59b7490e16d9',
  'personal',
  'Lucas'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Lucas';
*/

-- OPÇÃO 3: Para galordyy@gmail.com
-- (ID: a85e12d1-6222-454e-b57c-08c8e322fcb7)
/*
INSERT INTO public.profiles (id, role, name)
VALUES (
  'a85e12d1-6222-454e-b57c-08c8e322fcb7',
  'personal',
  'Galordy'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Galordy';
*/

-- OPÇÃO 4: Para luanferrati12@gmail.com
-- (ID: 6d02236a-447d-454e-a6a6-0e2d415ff241)
/*
INSERT INTO public.profiles (id, role, name)
VALUES (
  '6d02236a-447d-454e-a6a6-0e2d415ff241',
  'personal',
  'Luan'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Luan';
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
WHERE p.role = 'personal'
ORDER BY p.created_at DESC;

-- =====================================================
-- VER TODOS OS PROFILES (para debug)
-- =====================================================

SELECT 
  p.id,
  p.name,
  p.role,
  u.email,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;





