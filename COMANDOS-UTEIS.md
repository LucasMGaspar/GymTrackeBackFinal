# 🛠️ Comandos Úteis - Personal Trainer SaaS

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar build de produção localmente
npm start

# Lint
npm run lint
```

## TypeScript

```bash
# Verificar tipos sem compilar
npx tsc --noEmit

# Verificar tipos em modo watch
npx tsc --noEmit --watch
```

## Git

```bash
# Status
git status

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "sua mensagem"

# Push
git push

# Ver histórico
git log --oneline --graph

# Criar branch
git checkout -b feature/nome-da-feature

# Voltar para main
git checkout main
```

## Supabase (SQL)

### Verificar RLS

```sql
-- Ver políticas de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';

-- Ver todas as políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Queries Úteis

```sql
-- Ver ID do usuário atual (logado)
SELECT auth.uid();

-- Ver email do usuário atual
SELECT auth.email();

-- Ver todos os usuários
SELECT id, email, created_at FROM auth.users;

-- Limpar todas as sessões de um aluno (reset)
DELETE FROM workout_sessions WHERE student_user_id = 'USER-ID-AQUI';

-- Ver treinos de hoje
SELECT 
    ws.*,
    wt.name as template_name
FROM workout_sessions ws
LEFT JOIN workout_templates wt ON wt.id = ws.template_id
WHERE ws.session_date = CURRENT_DATE;

-- Estatísticas de um aluno
SELECT 
    COUNT(*) FILTER (WHERE status = 'done') as treinos_concluidos,
    COUNT(*) FILTER (WHERE status = 'in_progress') as treinos_em_andamento,
    MAX(session_date) as ultimo_treino
FROM workout_sessions
WHERE student_user_id = 'USER-ID-AQUI';

-- Ver PRs (personal records) de um aluno
SELECT 
    e.name as exercicio,
    MAX(wse.load) as max_carga,
    MAX(wse.reps_done) as max_reps
FROM workout_session_exercises wse
JOIN exercises e ON e.id = wse.exercise_id
JOIN workout_sessions ws ON ws.id = wse.session_id
WHERE ws.student_user_id = 'USER-ID-AQUI'
GROUP BY e.id, e.name
ORDER BY max_carga DESC;
```

### Reset Database (CUIDADO!)

```sql
-- Desabilitar RLS temporariamente (apenas dev/teste)
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Limpar todas as tabelas (CUIDADO! Perda de dados)
TRUNCATE TABLE workout_session_exercises CASCADE;
TRUNCATE TABLE workout_sessions CASCADE;
TRUNCATE TABLE workout_template_exercises CASCADE;
TRUNCATE TABLE workout_templates CASCADE;
TRUNCATE TABLE exercises CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Reset completo (deleta e recria schema)
-- USE APENAS EM DESENVOLVIMENTO!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Depois execute schema.sql novamente
```

## Debug

### Logs do Servidor

```bash
# No terminal onde npm run dev está rodando
# Pressione Ctrl+C para parar
# Os logs aparecem automaticamente

# Para logs mais verbosos
DEBUG=* npm run dev
```

### Inspecionar Build

```bash
# Analisar bundle
npm run build

# Ver tamanho dos chunks
npx next build --profile

# Analisar com bundle analyzer (adicione o pacote primeiro)
npm install @next/bundle-analyzer
```

### Network

```bash
# Testar endpoint
curl http://localhost:3000/api/student/save-workout \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"exercises": []}'

# Com autenticação (pegue o token do cookie)
curl http://localhost:3000/api/student/save-workout \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=SEU-TOKEN" \
  -d '{"exercises": []}'
```

## Limpeza

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules e reinstalar
rm -rf node_modules
npm install

# Limpar tudo (node_modules + .next + cache)
rm -rf node_modules .next
npm install
npm run dev
```

## Testes Manuais (Checklist)

### Autenticação
```bash
# 1. Acessar /login
open http://localhost:3000/login

# 2. Inserir email e enviar
# 3. Verificar email
# 4. Clicar no magic link
# 5. Verificar redirect para área correta
```

### Treino do Dia (Aluno)
```bash
# 1. Login como aluno
# 2. Acessar /app/student/today
open http://localhost:3000/app/student/today

# 3. Testar:
# - Ver exercícios
# - Preencher séries/reps/carga
# - Salvar progresso
# - Copiar última sessão
# - Concluir treino
# - Verificar empty state (dia sem treino)
```

## Supabase CLI (Opcional)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link com projeto
supabase link --project-ref SEU-PROJECT-REF

# Gerar types TypeScript do banco
supabase gen types typescript --linked > lib/database.types.ts

# Migrations (quando implementado)
supabase db diff
supabase db push
```

## Performance

```bash
# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Bundle size
npm run build
# Ver output no console

# Analisar dependências
npx depcheck

# Encontrar duplicatas
npm dedupe
```

## Segurança

```bash
# Audit de vulnerabilidades
npm audit

# Fix automático
npm audit fix

# Verificar packages desatualizados
npm outdated

# Atualizar packages
npm update

# Atualizar Next.js
npm install next@latest react@latest react-dom@latest
```

## Database Migrations (Futuro)

```sql
-- Template para nova migration
-- migrations/001_add_column.sql

BEGIN;

ALTER TABLE nome_tabela
ADD COLUMN nova_coluna TEXT;

-- Atualizar RLS se necessário
CREATE POLICY "policy_name" ON nome_tabela
FOR SELECT USING (auth.uid() = user_id);

COMMIT;
```

## Environment Variables

```bash
# Verificar env vars (não mostra valores)
echo $NEXT_PUBLIC_SUPABASE_URL

# Listar todas as env vars do Next.js
# No código:
console.log(process.env);

# Criar .env.local a partir do exemplo
cp .env.example .env.local

# Editar
nano .env.local
# ou
code .env.local
```

## Vercel (Deploy)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod

# Ver logs
vercel logs

# Listar projetos
vercel list

# Environment variables
vercel env ls
vercel env add NOME_DA_VAR
vercel env rm NOME_DA_VAR
```

## Docker (Futuro)

```bash
# Build
docker build -t personal-trainer-saas .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  personal-trainer-saas

# Stop
docker stop $(docker ps -q --filter ancestor=personal-trainer-saas)

# Remove
docker rm $(docker ps -a -q --filter ancestor=personal-trainer-saas)
```

## Backup

```bash
# Backup do código
git push origin main

# Backup do banco (Supabase Dashboard)
# Settings > Database > Backups

# Export manual (SQL)
# Use Supabase SQL Editor:
COPY (SELECT * FROM profiles) TO '/tmp/backup-profiles.csv' CSV HEADER;
```

## Quick Fixes

### Port já em uso
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Cache problems
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### TypeScript errors após atualização
```bash
rm -rf node_modules .next
npm install
npx tsc --noEmit
```

### Supabase auth não funciona
```bash
# 1. Verificar .env.local
cat .env.local

# 2. Verificar Redirect URLs no Supabase
# Dashboard > Authentication > URL Configuration

# 3. Limpar cookies do navegador
# DevTools > Application > Cookies > Clear All
```

## Referências Rápidas

### Next.js
- Docs: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### Supabase
- Docs: https://supabase.com/docs
- Auth: https://supabase.com/docs/guides/auth
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- Cheat Sheet: https://nerdcave.com/tailwind-cheat-sheet

### TypeScript
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Cheat Sheet: https://www.typescriptlang.org/cheatsheets

---

**Dica:** Salve este arquivo nos seus favoritos para referência rápida! 📌
