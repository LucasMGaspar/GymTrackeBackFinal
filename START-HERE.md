# 🚀 START HERE - Quick Start Guide

## ✅ O Que Você Tem Agora

Um **MVP funcional** de uma aplicação SaaS para gerenciamento de treinos entre personal trainers e alunos.

**Stack:** Next.js 15 + React 19 + Supabase + TypeScript + Tailwind CSS

---

## 📋 Checklist Rápido

### Para Começar (5 minutos)

- [ ] 1. Criar conta no Supabase (https://supabase.com)
- [ ] 2. Copiar `.env.example` para `.env.local`
- [ ] 3. Adicionar suas credenciais Supabase no `.env.local`
- [ ] 4. Executar SQL do arquivo `/supabase/schema.sql` no Supabase SQL Editor
- [ ] 5. Configurar Redirect URLs no Supabase Auth
- [ ] 6. Rodar `npm run dev`
- [ ] 7. Acessar http://localhost:3000

**Documentação completa:** `SETUP.md`

---

## 🎯 O Que Funciona Agora

### ✅ Aluno (Student)
- Login com magic link (sem senha)
- Ver treino do dia (baseado no dia da semana)
- Registrar séries, reps e carga
- Copiar dados da última sessão (1 clique)
- Salvar progresso sem concluir
- Concluir treino
- Layout mobile-first responsivo

### ⏳ Personal Trainer (Em Desenvolvimento)
- Dashboard básico (criado)
- CRUD de Alunos (próxima entrega)
- CRUD de Exercícios (próxima entrega)
- Templates de Treino (próxima entrega)
- Histórico e Métricas (próxima entrega)

---

## 📂 Arquivos Importantes

### Documentação
- **START-HERE.md** ← Você está aqui!
- **SETUP.md** - Setup detalhado passo a passo
- **DEPLOYMENT.md** - Como fazer deploy (Vercel, etc)
- **ENTREGA-1-RESUMO.md** - Resumo técnico completo
- **COMANDOS-UTEIS.md** - Comandos úteis para o dia a dia
- **README.md** - Overview do projeto

### Código Principal
- **`/app`** - App Router (Next.js)
  - `/login` - Página de login
  - `/app/student/today` - Treino do dia (funcional)
  - `/api` - APIs REST
- **`/components`** - Componentes reutilizáveis
- **`/lib`** - Configurações (Supabase, types, utils)
- **`/supabase`** - Schema SQL + seed
- **`middleware.ts`** - Proteção de rotas

### Configuração
- **`.env.local`** - Variáveis de ambiente (você precisa criar)
- **`package.json`** - Dependências
- **`tsconfig.json`** - TypeScript config

---

## 🎬 Fluxo de Teste Recomendado

### 1. Setup Inicial (5 min)
```bash
# 1. Criar projeto Supabase
# 2. Configurar .env.local
cp .env.example .env.local
nano .env.local

# 3. Instalar (se ainda não instalou)
npm install

# 4. Rodar
npm run dev
```

### 2. Teste Básico (2 min)
```bash
# 1. Abrir http://localhost:3000
# 2. Fazer login com seu email
# 3. Verificar email e clicar no link
# 4. Ver redirecionamento
```

### 3. Teste Completo com Dados (10 min)
```bash
# Seguir guia em: /supabase/seed-example.sql
# Criar:
# - Personal trainer
# - Aluno
# - Exercícios
# - Templates de treino
# Testar fluxo completo
```

---

## 🔥 Quick Commands

```bash
# Desenvolvimento
npm run dev              # Rodar em dev
npm run build            # Build de produção
npm run start            # Rodar build

# Verificação
npx tsc --noEmit         # Verificar tipos
npm run lint             # Lint

# Limpeza
rm -rf .next             # Limpar cache Next.js
rm -rf node_modules      # Limpar dependências
npm install              # Reinstalar
```

---

## 🆘 Problemas Comuns

### Magic link não chega
**Solução:**
1. Verifique spam/lixeira
2. Confirme que SMTP está configurado no Supabase
3. Em desenvolvimento, veja os logs no Supabase Dashboard

### "Unauthorized" ao acessar dados
**Solução:**
1. Confirme que o SQL (`schema.sql`) foi executado
2. Verifique se RLS está ativo: `SELECT * FROM pg_policies;`
3. Teste no SQL Editor: `SELECT auth.uid();` (deve retornar seu ID)

### Treino do dia não aparece
**Solução:**
1. Confirme que existe template para o dia da semana atual (0-6)
2. Verifique se `student_user_id` está vinculado na tabela `students`
3. Execute queries manualmente no SQL Editor para debug

### Port 3000 já em uso
**Solução:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Ou rode em outra porta
PORT=3001 npm run dev
```

**Mais soluções:** `SETUP.md` (seção Troubleshooting)

---

## 📊 Status do MVP

| Feature | Status | Nota |
|---------|--------|------|
| Auth Magic Link | ✅ | 100% funcional |
| Middleware/RLS | ✅ | Proteção completa |
| Treino do Dia (Aluno) | ✅ | Totalmente funcional |
| Dashboard (Personal) | 🟡 | Base criada |
| CRUD Exercícios | ⏳ | Próxima entrega |
| CRUD Alunos | ⏳ | Próxima entrega |
| Templates | ⏳ | Próxima entrega |
| Histórico | ⏳ | Próxima entrega |
| Métricas/Dashboard | ⏳ | Próxima entrega |

**Legenda:** ✅ Completo | 🟡 Parcial | ⏳ Pendente

**MVP atual:** ~30% completo  
**Entrega 1:** ✅ COMPLETA

---

## 🎯 Próximos Passos

### Imediato
1. [ ] Fazer setup seguindo `SETUP.md`
2. [ ] Testar login
3. [ ] Popular banco com `seed-example.sql`
4. [ ] Testar treino do dia

### Esta Semana
1. [ ] Deploy na Vercel (guia: `DEPLOYMENT.md`)
2. [ ] Implementar CRUD de Exercícios (Entrega 2)
3. [ ] Implementar CRUD de Alunos (Entrega 3)

### Próxima Semana
1. [ ] Implementar Templates de Treino (Entrega 4)
2. [ ] Implementar Histórico (Entrega 5)
3. [ ] Dashboard com métricas (Entrega 6)

---

## 📚 Onde Encontrar Cada Coisa

### Preciso configurar o projeto
→ `SETUP.md`

### Quero fazer deploy
→ `DEPLOYMENT.md`

### Quero comandos úteis
→ `COMANDOS-UTEIS.md`

### Quero ver detalhes técnicos
→ `ENTREGA-1-RESUMO.md`

### Preciso do SQL do banco
→ `supabase/schema.sql`

### Quero dados de teste
→ `supabase/seed-example.sql`

### Quero entender o código
→ Leia os comentários nos arquivos `.ts`/`.tsx`

---

## 🎨 Arquitetura Visual

```
┌─────────────────────────────────────────┐
│         USUÁRIO (Browser)               │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│      NEXT.JS 15 (App Router)            │
│  ┌────────────────────────────────┐     │
│  │  Middleware (Auth Check)       │     │
│  └────────────┬───────────────────┘     │
│               ↓                          │
│  ┌────────────────────────────────┐     │
│  │  Server Components (RSC)       │     │
│  │  - Fetch data from Supabase    │     │
│  │  - Render HTML                 │     │
│  └────────────┬───────────────────┘     │
│               ↓                          │
│  ┌────────────────────────────────┐     │
│  │  Client Components (React)     │     │
│  │  - Interatividade              │     │
│  │  - Forms, buttons, etc         │     │
│  └────────────┬───────────────────┘     │
└───────────────┼─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│         SUPABASE (Backend)              │
│  ┌────────────────────────────────┐     │
│  │  Auth (Magic Link)             │     │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │  Postgres + RLS                │     │
│  │  - 7 tabelas                   │     │
│  │  - Policies por role           │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

---

## 🔐 Segurança

**Implementado:**
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas de acesso por role (personal/student)
- ✅ Service role key NUNCA no client
- ✅ Middleware protegendo rotas
- ✅ Validação Zod em todas as APIs
- ✅ HTTPS obrigatório (Vercel fornece automaticamente)

**Você pode confiar:** Personal só vê seus alunos, aluno só vê seus treinos.

---

## 💡 Dicas

1. **Leia SETUP.md primeiro** - Passo a passo completo
2. **Use seed-example.sql** - Dados de teste prontos
3. **Consulte COMANDOS-UTEIS.md** - Comandos que você vai usar
4. **Deploy na Vercel é grátis** - Siga DEPLOYMENT.md
5. **RLS é sua amiga** - Não precisa validar permissões manualmente

---

## 🤝 Contribuindo

Este é um MVP em desenvolvimento ativo.

**Próximas entregas:**
- Entrega 2: CRUD de Exercícios
- Entrega 3: CRUD de Alunos
- Entrega 4: Templates de Treino
- Entrega 5: Histórico
- Entrega 6: Dashboard e Métricas
- Entrega 7: Polimento Final

---

## 📞 Precisa de Ajuda?

1. **Leia os arquivos .md** - Documentação completa
2. **Verifique COMANDOS-UTEIS.md** - Comandos prontos
3. **Seção Troubleshooting** em SETUP.md
4. **Logs do console** - `npm run dev` mostra erros
5. **Supabase Dashboard** - Veja logs de Auth e Database

---

## 🎉 Parabéns!

Você tem um MVP funcional de uma aplicação SaaS moderna!

**Stack de ponta:** Next.js 15 + React 19 + Supabase  
**Deploy ready:** Build sem erros ✓  
**Production ready:** RLS + validações + segurança ✓

---

**Próximo arquivo para ler:** `SETUP.md`

**Tempo estimado para estar rodando:** 5-10 minutos

**BOA SORTE! 🚀**
