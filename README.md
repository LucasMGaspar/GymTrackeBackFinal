# Personal Trainer SaaS MVP

Web app responsivo para gerenciamento de treinos entre personal trainers e alunos.

## Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **@supabase/ssr** (SSR authentication)

## Funcionalidades

### Personal Trainer
- Cadastrar e gerenciar alunos
- Criar biblioteca de exercícios
- Montar treinos-template por dia da semana
- Ver execuções recentes e métricas dos alunos

### Aluno
- Ver treino do dia
- Registrar execução (séries, reps, carga)
- Concluir treinos
- Ver histórico de treinos

### Dashboard
- Aderência (treinos/semana)
- Total de treinos no mês
- Personal Records (PRs) por exercício

## Setup

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env.local`
   - Adicione suas credenciais do Supabase

4. Execute o SQL do schema no Supabase:
```bash
# Execute o arquivo supabase/schema.sql no SQL Editor do Supabase
```

5. Rode o projeto:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
/app
  /api              # Route handlers
  /app              # Área autenticada
    /personal       # Páginas do personal
    /student        # Páginas do aluno
  /login            # Auth magic link
/components         # Componentes reutilizáveis
/lib                # Utils e configurações
/supabase           # Schema SQL e migrations
```

## Deploy

O projeto está otimizado para deploy na Vercel:

```bash
vercel deploy
```

## Licença

MIT
