-- =====================================================
-- SCRIPT RÁPIDO - CRIAR PERSONAL TRAINER
-- =====================================================
-- Baseado nos usuários que você mostrou
-- =====================================================

-- Escolha qual usuário você quer transformar em personal trainer
-- Descomente (remova o --) a opção que você quer usar

-- OPÇÃO 1: lucasmanoel.g.g@gmail.com (recomendado - parece ser o principal)
INSERT INTO public.profiles (id, role, name)
VALUES (
  'cc661548-ff37-4b29-90e8-61daf5af3a69',
  'personal',
  'Lucas Manoel'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Lucas Manoel';

-- OPÇÃO 2: lucasmanoe.g.g@gmail.com
-- INSERT INTO public.profiles (id, role, name)
-- VALUES (
--   '4d6ccdd6-9230-4001-9e3f-59b7490e16d9',
--   'personal',
--   'Lucas'
-- )
-- ON CONFLICT (id) 
-- DO UPDATE SET 
--   role = 'personal',
--   name = 'Lucas';

-- OPÇÃO 3: galordyy@gmail.com
-- INSERT INTO public.profiles (id, role, name)
-- VALUES (
--   'a85e12d1-6222-454e-b57c-08c8e322fcb7',
--   'personal',
--   'Galordy'
-- )
-- ON CONFLICT (id) 
-- DO UPDATE SET 
--   role = 'personal',
--   name = 'Galordy';

-- OPÇÃO 4: luanferrati12@gmail.com
-- INSERT INTO public.profiles (id, role, name)
-- VALUES (
--   '6d02236a-447d-454e-a6a6-0e2d415ff241',
--   'personal',
--   'Luan'
-- )
-- ON CONFLICT (id) 
-- DO UPDATE SET 
--   role = 'personal',
--   name = 'Luan';

-- =====================================================
-- VERIFICAR
-- =====================================================

SELECT 
  p.id,
  p.name,
  p.role,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'personal';


