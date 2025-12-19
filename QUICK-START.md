# 🚀 QUICK START - Rodar na Sua Máquina

## ⚡ Setup Rápido (10 minutos)

### Pré-requisitos
- Node.js 18+ instalado
- Conta no Supabase (grátis)
- Um email válido para testar

---

## 📋 PASSO A PASSO

### 1️⃣ Criar Projeto no Supabase (3 min)

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login/cadastro (GitHub, Google, etc)
4. Clique em "New Project"
5. Preencha:
   - **Name:** personal-trainer-mvp (ou qualquer nome)
   - **Database Password:** Crie uma senha forte (anote!)
   - **Region:** Escolha a mais próxima (South America - São Paulo)
6. Clique "Create new project"
7. **Aguarde ~2 minutos** enquanto o Supabase provisiona o banco

---

### 2️⃣ Pegar as Credenciais (1 min)

1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem no menu lateral)
2. Clique em **API**
3. Você verá:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave longa começando com `eyJ...`)
   - **service_role** key (⚠️ SECRETA - clique em "Reveal" para ver)

**Anote essas 3 informações!**

---

### 3️⃣ Executar o SQL (2 min)

1. No Supabase, vá em **SQL Editor** (no menu lateral)
2. Clique em "New query"
3. Abra o arquivo `/workspace/supabase/schema.sql` (no seu projeto)
4. **Copie TODO o conteúdo** do arquivo
5. **Cole no SQL Editor** do Supabase
6. Clique em "Run" (botão verde no canto inferior direito)
7. ✅ Aguarde aparecer "Success. No rows returned"

**Pronto!** Todas as tabelas, índices e RLS policies foram criadas.

---

### 4️⃣ Configurar Variáveis de Ambiente (1 min)

No terminal, na pasta do projeto:

```bash
# 1. Copiar o template
cp .env.example .env.local

# 2. Editar o arquivo
nano .env.local
# ou
code .env.local
# ou abra no seu editor favorito
```

Cole suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Importante:** Substitua pelas suas credenciais reais!

---

### 5️⃣ Configurar Auth no Supabase (1 min)

1. No Supabase, vá em **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque: `http://localhost:3000`
3. Em **Redirect URLs**, adicione: `http://localhost:3000/auth/callback`
4. Clique "Save"

---

### 6️⃣ Instalar e Rodar (2 min)

```bash
# 1. Instalar dependências (se ainda não instalou)
npm install

# 2. Rodar o projeto
npm run dev
```

Aguarde aparecer:

```
▲ Next.js 15.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

---

### 7️⃣ Acessar e Testar! 🎉

1. Abra o navegador: **http://localhost:3000**
2. Você será redirecionado para `/login`
3. Digite seu email
4. Clique "Enviar link mágico"
5. **Verifique seu email** (pode demorar 1-2 min)
6. **Clique no link** no email
7. Você será autenticado e redirecionado!

---

## 🧪 Primeira Vez? Crie um Personal Trainer

Como você não tem dados ainda, você será criado como **aluno** por padrão.

Para testar como **Personal Trainer**:

### Opção A: Via SQL (Rápido)

1. Vá no Supabase → **SQL Editor**
2. Execute este SQL (substitua o email):

```sql
-- 1. Pegar seu user_id
SELECT id, email FROM auth.users WHERE email = 'SEU-EMAIL@aqui.com';

-- 2. Copie o ID que apareceu
-- 3. Execute isso (cole o ID no lugar de YOUR-USER-ID):
UPDATE profiles 
SET role = 'personal' 
WHERE id = 'YOUR-USER-ID';
```

3. Faça logout e login novamente
4. Você será redirecionado para `/app/personal` 🎉

### Opção B: Criar outro usuário

1. Use outro email para criar um personal
2. Siga os passos do SQL acima com o novo email

---

## 📚 Testando as Funcionalidades

### Como Personal Trainer

1. **Dashboard:** http://localhost:3000/app/personal
2. **Exercícios:** http://localhost:3000/app/personal/exercises
   - Clique "+ Novo Exercício"
   - Preencha: Nome, Grupo Muscular, Observações
   - Teste busca e filtros

### Como Aluno

Para testar como aluno, você precisa:

1. Criar exercícios (como personal)
2. Criar um aluno (será implementado na Entrega 3)
3. Criar templates de treino (será implementado na Entrega 4)
4. Acessar `/app/student/today` e ver o treino do dia

**Por enquanto**, você pode criar dados de teste manualmente via SQL (veja `supabase/seed-example.sql`).

---

## 🐛 Problemas Comuns

### ❌ "Failed to fetch" ao fazer login

**Causa:** Variáveis de ambiente erradas

**Solução:**
```bash
# Verifique o .env.local
cat .env.local

# As URLs devem começar com https:// e ser do Supabase
# As keys devem começar com eyJ...
```

### ❌ Link mágico não chega

**Causa:** SMTP não configurado ou email na spam

**Solução:**
1. Verifique a pasta de spam
2. No Supabase → **Authentication** → **Logs**, veja se o email foi enviado
3. Em dev, o Supabase pode demorar 1-2 min para enviar

### ❌ "Unauthorized" ao acessar dados

**Causa:** SQL não foi executado corretamente

**Solução:**
```bash
# No Supabase SQL Editor, execute:
SELECT * FROM profiles;

# Se der erro "relation does not exist", execute o schema.sql novamente
```

### ❌ Port 3000 já em uso

**Solução:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Ou rode em outra porta
PORT=3001 npm run dev
```

### ❌ Redirect infinito

**Causa:** Redirect URLs não configuradas

**Solução:**
1. Supabase → **Authentication** → **URL Configuration**
2. Adicione: `http://localhost:3000/auth/callback`
3. Salve e tente novamente

---

## ✅ Checklist de Sucesso

- [ ] Projeto Supabase criado
- [ ] SQL executado sem erros
- [ ] `.env.local` configurado
- [ ] Redirect URLs configuradas
- [ ] `npm run dev` rodando
- [ ] Login funcionando
- [ ] Magic link recebido e clicado
- [ ] Redirecionado para área correta

---

## 🎯 Próximos Passos

### 1. Explore o Sistema
- Dashboard do personal
- Crie alguns exercícios
- Teste busca e filtros

### 2. Popular com Dados de Teste
- Siga o guia em `supabase/seed-example.sql`
- Crie exercícios, alunos e templates

### 3. Desenvolver
- Próxima entrega: CRUD de Alunos
- Depois: Templates de Treino
- Depois: Histórico e Métricas

---

## 📖 Documentação Completa

- **SETUP.md** - Setup detalhado completo
- **ENTREGA-1-RESUMO.md** - O que foi feito na Entrega 1
- **ENTREGA-2-RESUMO.md** - O que foi feito na Entrega 2
- **COMANDOS-UTEIS.md** - Comandos úteis do dia a dia

---

## 🆘 Precisa de Ajuda?

1. Veja `SETUP.md` para troubleshooting completo
2. Verifique os logs no terminal (`npm run dev`)
3. Verifique os logs no Supabase Dashboard
4. Supabase Documentation: https://supabase.com/docs

---

## ⚡ TL;DR (Resumão)

```bash
# 1. Criar projeto no Supabase (https://supabase.com)
# 2. Copiar URL e keys
# 3. Executar supabase/schema.sql no SQL Editor
# 4. Configurar .env.local com suas credenciais
# 5. Configurar Redirect URLs no Supabase Auth
# 6. Rodar:
npm install
npm run dev
# 7. Acessar http://localhost:3000
# 8. Login com seu email
# 9. Verificar email e clicar no link
# 10. 🎉 Pronto!
```

**Tempo total:** ~10 minutos

**Dificuldade:** Fácil ✅

**Pronto para produção:** Sim! (basta trocar as URLs)

---

Bom desenvolvimento! 🚀💪
