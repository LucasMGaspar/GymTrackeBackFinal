# 🚨 CRIAR PRIMEIRO USUÁRIO PERSONAL TRAINER

Se você deletou acidentalmente seu usuário e não tem mais como fazer login, use este guia.

## ⚠️ IMPORTANTE
Este é um endpoint temporário. **DELETE o arquivo após usar!**

---

## 📋 MÉTODO 1: Via API (Mais Fácil)

### Passo 1: Iniciar o servidor
```bash
npm run dev
```

### Passo 2: Fazer requisição POST

**Opção A: Via cURL (Terminal)**
```bash
curl -X POST http://localhost:3000/api/admin/create-first-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suaSenha123",
    "name": "Seu Nome"
  }'
```

**Opção B: Via Postman/Insomnia**
- URL: `http://localhost:3000/api/admin/create-first-user`
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "seu@email.com",
  "password": "suaSenha123",
  "name": "Seu Nome"
}
```

**Opção C: Via Navegador (usando fetch no console)**
1. Abra o navegador em `http://localhost:3000`
2. Abra o Console (F12)
3. Cole e execute:
```javascript
fetch('/api/admin/create-first-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'seu@email.com',
    password: 'suaSenha123',
    name: 'Seu Nome'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Passo 3: Fazer login
1. Acesse `http://localhost:3000/login`
2. Use o email e senha que você criou
3. Você será redirecionado para `/app/personal`

### Passo 4: Deletar o endpoint
```bash
# Delete o arquivo por segurança
rm app/api/admin/create-first-user/route.ts
```

---

## 📋 MÉTODO 2: Via Supabase Dashboard

### Passo 1: Criar usuário no Supabase
1. Acesse seu projeto no Supabase Dashboard
2. Vá em **Authentication** → **Users**
3. Clique em **Add User** → **Create new user**
4. Preencha:
   - **Email**: seu@email.com
   - **Password**: suaSenha123
   - **Auto Confirm User**: ✅ (marque esta opção)
5. Clique em **Create User**

### Passo 2: Criar Profile via SQL
1. Vá em **SQL Editor**
2. Execute este script (substitua o email):

```sql
-- 1. Pegar o ID do usuário que você acabou de criar
SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- 2. Copie o ID que apareceu e execute (substitua YOUR-USER-ID):
INSERT INTO public.profiles (id, role, name)
VALUES (
  'YOUR-USER-ID',  -- Cole o ID aqui
  'personal',
  'Seu Nome'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'personal',
  name = 'Seu Nome';
```

### Passo 3: Fazer login
1. Acesse sua aplicação
2. Faça login com o email e senha criados
3. Você será redirecionado para `/app/personal`

---

## 📋 MÉTODO 3: Via SQL Direto (Avançado)

⚠️ **Atenção**: Este método requer acesso direto ao banco. Use apenas se os outros não funcionarem.

```sql
-- Este script cria um usuário diretamente no auth.users
-- NOTA: Isso pode não funcionar dependendo das permissões do seu banco

-- 1. Gerar um UUID para o usuário
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'seu@email.com';
  user_password TEXT := crypt('suaSenha123', gen_salt('bf'));
  user_name TEXT := 'Seu Nome';
BEGIN
  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    user_password,
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', user_name),
    false,
    'authenticated'
  );

  -- Criar profile
  INSERT INTO public.profiles (id, role, name)
  VALUES (new_user_id, 'personal', user_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'personal',
    name = user_name;

  RAISE NOTICE '✅ Usuário criado com ID: %', new_user_id;
END $$;
```

---

## ✅ Verificar se Funcionou

Execute esta query no SQL Editor:

```sql
SELECT 
  p.id,
  p.name,
  p.role,
  u.email,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'personal';
```

Você deve ver seu usuário listado.

---

## 🔒 Segurança

**IMPORTANTE**: 
- O endpoint `/api/admin/create-first-user` é temporário
- **DELETE o arquivo** após criar seu usuário
- Não deixe este endpoint em produção
- Use senhas fortes

---

## 🆘 Problemas?

Se nenhum método funcionar:
1. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada no `.env`
2. Verifique se `NEXT_PUBLIC_SUPABASE_URL` está configurada
3. Verifique os logs do servidor para erros
4. Tente criar o usuário diretamente no Supabase Dashboard primeiro





