# 🚀 QUICKSTART - Rodar o Projeto em 5 Minutos

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)

## ⚡ Setup Rápido

### 1. Clone e instale
```bash
git clone <seu-repo>
cd personal-trainer-saas
npm install
```

### 2. Configure Supabase

#### a) Crie um projeto no Supabase
1. Acesse https://supabase.com
2. Crie um novo projeto
3. Anote: **URL** e **anon key**

#### b) Configure variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

#### c) Execute as migrations SQL
No **Supabase Dashboard → SQL Editor**, execute em ordem:

1. **Schema base:**
```sql
-- Cole o conteúdo de: supabase/schema.sql
```

2. **Campos extras:**
```sql
-- Cole o conteúdo de: supabase/migrations/002_add_session_fields.sql
```

3. **Comentários:**
```sql
-- Cole o conteúdo de: supabase/migrations/003_workout_comments.sql
```

4. **Gamificação:**
```sql
-- Cole o conteúdo de: supabase/migrations/004_streak_and_gamification.sql
```

### 3. Rode o projeto
```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🧪 Testando as Features

### 1. Criar Personal Trainer
1. Acesse `/login`
2. Digite seu email
3. Receba magic link no email
4. Clique no link → você será redirecionado como **personal**

### 2. Criar Aluno
1. Área do Personal → **Alunos** → **Novo Aluno**
2. Preencha: Nome e Email
3. Marque "Enviar convite"
4. Aluno recebe magic link no email
5. Aluno clica no link → acessa como **student**

### 3. Criar Exercícios
1. Personal → **Exercícios** → **Novo Exercício**
2. Preencha: Nome, Grupo Muscular
3. Repita para criar 5-10 exercícios

### 4. Criar Template de Treino
1. Personal → **Alunos** → Clicar **Templates** no card do aluno
2. Escolher dia da semana (ex: Segunda)
3. Clicar **Criar Treino**
4. Adicionar exercícios, configurar séries/reps
5. Salvar

### 5. Aluno Fazer Treino
1. Login como aluno
2. **Treino** (aba do meio no mobile)
3. Preencher séries, reps, carga
4. Clicar **Concluir Treino**

### 6. Ver Streak e Badges
1. Dashboard do aluno
2. Ver card de streak 🔥
3. Rolar para ver badges

### 7. Comentar no Treino
1. **Histórico** → Clicar em sessão
2. Rolar até comentários
3. Adicionar comentário
4. Personal pode ver e responder

### 8. Gerar Relatório PDF
1. Personal → **Alunos** → Clicar **Relatório**
2. Escolher mês/ano
3. Clicar **Gerar PDF**
4. PDF baixa automaticamente

---

## 🐛 Troubleshooting

### Erro: "Invalid API key"
- Verifique se copiou corretamente a **anon key** (não é a service_role!)
- Verifique se salvou em `.env.local` (não `.env`)

### Erro: "Failed to fetch"
- Certifique-se que executou todas as 4 migrations SQL
- Verifique se o Supabase URL está correto

### Erro: "User not found"
- Execute a migration `schema.sql` que cria a tabela `profiles`
- Faça logout e login novamente

### Magic link não chega
- Verifique spam/lixo eletrônico
- Supabase free tier: confirme email do projeto primeiro

---

## 📚 Próximos Passos

Após testar localmente:

1. **[FINAL-FEATURES-SUMMARY.md](./FINAL-FEATURES-SUMMARY.md)** - Veja todas as features em detalhes
2. **[TESTING-GUIDE.md](./TESTING-GUIDE.md)** - Guia completo de testes
3. **Deploy:** Siga instruções em [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎯 Features Implementadas

- ✅ Sistema de Comentários 💬
- ✅ Streak & Gamificação 🔥
- ✅ Gráficos de Evolução 📈
- ✅ Relatórios PDF 📄
- ✅ 10 Badges Desbloqueáveis 🏆
- ✅ Bottom Navigation (Mobile) 📱
- ✅ Toast Notifications
- ✅ Loading States
- ✅ UI/UX Profissional

**Pronto para usar!** 🚀
