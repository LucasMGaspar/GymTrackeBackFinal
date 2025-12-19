# 🏋️ Personal Trainer SaaS MVP

Web app responsivo e gamificado para gerenciamento de treinos entre personal trainers e alunos.

## 🚀 Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **@supabase/ssr** (SSR authentication)
- **jsPDF** (Geração de relatórios)

## ✨ Funcionalidades

### 👨‍🏫 Personal Trainer
- ✅ Cadastrar e gerenciar alunos
- ✅ Criar biblioteca de exercícios
- ✅ Montar treinos-template por dia da semana
- ✅ Ver execuções recentes e métricas dos alunos
- ✅ **Comentar em treinos dos alunos** 💬
- ✅ **Gerar relatórios mensais em PDF** 📄

### 🏃 Aluno
- ✅ Ver treino do dia
- ✅ Registrar execução (séries, reps, carga)
- ✅ Concluir treinos
- ✅ Ver histórico de treinos
- ✅ **Adicionar observações nos treinos** 💬
- ✅ **Acompanhar streak (dias seguidos)** 🔥
- ✅ **Desbloquear badges/conquistas** 🏆
- ✅ **Ver gráficos de evolução de carga** 📈

### 📊 Dashboard
- ✅ Aderência (treinos/semana)
- ✅ Total de treinos no mês
- ✅ Personal Records (PRs) por exercício
- ✅ **Streak atual e recorde** 🔥
- ✅ **10 badges desbloqueáveis** 🎯
- ✅ **Gráficos de progresso** 📈

## 🎮 Features de Gamificação

### Streak System
- Contador automático de dias seguidos treinando
- Visual animado com 🔥 (ativo) ou 💤 (quebrado)
- Progresso para próxima conquista
- Mensagens motivacionais dinâmicas

### Achievements (10 badges)
| Badge | Nome | Condição |
|-------|------|----------|
| 🎯 | Primeira Vitória | 1 treino |
| 🔥 | Consistente | 3 dias seguidos |
| 💪 | Warrior | 7 dias seguidos |
| ⚡ | Máquina | 14 dias seguidos |
| 👑 | Lendário | 30 dias seguidos |
| 🌟 | Iniciante Dedicado | 10 treinos |
| 📈 | Em Evolução | 25 treinos |
| 🏆 | Meio Século | 50 treinos |
| 💯 | Centurião | 100 treinos |
| 👊 | Elite | 250 treinos |

### Sistema de Comentários
- Personal e aluno podem comentar em treinos
- Badge "PERSONAL" diferencia papéis
- Tempo relativo ("5min atrás", "ontem")
- Avatares coloridos

### Gráficos de Evolução
- SVG customizado (zero dependências!)
- Linha + área preenchida
- Tendência com % (↗ ↘)
- Top 6 exercícios

### Relatórios PDF
- Profissional com logo
- Métricas do mês
- Aderência semanal
- Tabela de PRs
- Streak e consistência
- Download automático

## Setup

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env.local`
   - Adicione suas credenciais do Supabase

4. Execute as migrations SQL no Supabase:
```bash
# No SQL Editor do Supabase, execute em ordem:
# 1. supabase/schema.sql (schema base)
# 2. supabase/migrations/002_add_session_fields.sql (campos extras)
# 3. supabase/migrations/003_workout_comments.sql (comentários)
# 4. supabase/migrations/004_streak_and_gamification.sql (gamificação)
```

5. Rode o projeto:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
/app
  /api                    # Route handlers
    /comments             # API de comentários
    /achievements         # API de conquistas
    /reports              # API de relatórios PDF
  /app                    # Área autenticada
    /personal             # Páginas do personal
      /students           # Gerenciar alunos
        /[id]/templates   # Templates de treino
        /[id]/history     # Histórico do aluno
      /exercises          # Biblioteca de exercícios
    /student              # Páginas do aluno
      /dashboard          # Dashboard com métricas
      /today              # Treino do dia
      /history            # Histórico de treinos
  /login                  # Auth magic link
/components               # Componentes reutilizáveis
  /ui                     # UI components (Toast, BottomNav, Skeleton)
  WorkoutComments.tsx     # Sistema de comentários
  StreakDisplay.tsx       # Card de streak
  AchievementsBadges.tsx  # Grid de badges
  LoadProgressChart.tsx   # Gráfico individual
  ProgressCharts.tsx      # Wrapper de gráficos
  GenerateReportButton.tsx # Botão de relatório
/lib                      # Utils e configurações
  /reports                # Lógica de geração de PDF
/supabase                 # Schema SQL e migrations
  schema.sql              # Schema base
  /migrations             # Migrations incrementais
```

## 📄 Documentação

- **[FINAL-FEATURES-SUMMARY.md](./FINAL-FEATURES-SUMMARY.md)** - Guia completo das features implementadas
- **[UI-AUDIT.md](./UI-AUDIT.md)** - Análise de melhorias de UI/UX
- **[UI-UX-IMPROVEMENTS-SUMMARY.md](./UI-UX-IMPROVEMENTS-SUMMARY.md)** - Resumo de melhorias visuais
- **[TESTING-GUIDE.md](./TESTING-GUIDE.md)** - Como testar todas as funcionalidades

## Deploy

O projeto está otimizado para deploy na Vercel:

```bash
vercel deploy
```

## Licença

MIT
