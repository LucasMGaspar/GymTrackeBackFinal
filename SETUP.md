# Setup do Projeto - Personal Trainer SaaS MVP

## ✅ Estrutura Criada

### 1. Configuração Base
- ✅ Next.js 14+ com App Router
- ✅ TypeScript configurado
- ✅ Tailwind CSS
- ✅ Supabase SSR (@supabase/ssr)
- ✅ Zod para validação

### 2. Database Schema (SQL)
Localização: `/supabase/schema.sql`

**Tabelas criadas:**
- `profiles` - Perfis de usuários (personal/student)
- `students` - Relacionamento personal-aluno
- `exercises` - Biblioteca de exercícios
- `workout_templates` - Templates por dia da semana (0-6)
- `workout_template_exercises` - Exercícios do template
- `workout_sessions` - Sessões de treino executadas
- `workout_session_exercises` - Exercícios executados

**Recursos:**
- ✅ Índices otimizados
- ✅ RLS (Row Level Security) completo
- ✅ Políticas de acesso por role
- ✅ Trigger para auto-link de alunos

### 3. Autenticação
- ✅ Magic Link via Supabase Auth
- ✅ Middleware de proteção de rotas
- ✅ Redirect automático por role
- ✅ Páginas: `/login`, `/auth/callback`

### 4. Área do Aluno
**Rota:** `/app/student/today`

**Funcionalidades implementadas:**
- ✅ Ver treino do dia (baseado no dia da semana)
- ✅ Registrar séries, reps e carga
- ✅ Copiar dados da última sessão
- ✅ Salvar progresso
- ✅ Concluir treino
- ✅ Layout responsivo mobile-first

**APIs criadas:**
- `POST /api/student/save-workout` - Salvar progresso
- `POST /api/student/complete-workout` - Concluir treino
- `POST /api/student/copy-last-session` - Copiar última sessão

### 5. Área do Personal
**Rota:** `/app/personal`

- ✅ Dashboard básico com links
- ⏳ Gerenciamento de alunos (próximo passo)
- ⏳ Biblioteca de exercícios (próximo passo)
- ⏳ Criação de templates (próximo passo)

### 6. Componentes Reutilizáveis
- `TopNav` - Barra de navegação
- `EmptyState` - Estado vazio
- `LoadingSkeleton` - Carregamento

## 🚀 Como Configurar

### Passo 1: Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Crie um novo projeto
3. Anote a URL e as chaves (anon key + service role key)

### Passo 2: Executar o Schema SQL
1. Acesse o SQL Editor no Supabase
2. Copie todo o conteúdo de `/supabase/schema.sql`
3. Execute o SQL
4. Verifique se todas as tabelas foram criadas

### Passo 3: Configurar Variáveis de Ambiente
Crie o arquivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### Passo 4: Configurar Auth no Supabase

1. **Authentication > URL Configuration:**
   - Site URL: `http://localhost:3000` (dev) ou sua URL de produção
   - Redirect URLs: adicione `http://localhost:3000/auth/callback`

2. **Authentication > Email Templates:**
   - Customize o template do Magic Link se desejar

3. **Authentication > Providers:**
   - Certifique-se que "Email" está habilitado

### Passo 5: Rodar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📱 Testando o Sistema

### Como Personal Trainer

1. **Criar conta de Personal:**
   ```sql
   -- Execute no SQL Editor do Supabase APÓS fazer login via magic link
   -- Substitua 'SEU-EMAIL@example.com' pelo email que você usou
   
   -- Primeiro, pegue seu user_id
   SELECT id, email FROM auth.users WHERE email = 'SEU-EMAIL@example.com';
   
   -- Crie o profile como personal
   INSERT INTO public.profiles (id, role, name)
   VALUES ('SEU-USER-ID-AQUI', 'personal', 'Seu Nome');
   ```

2. **Logout e login novamente** - Você será redirecionado para `/app/personal`

### Como Aluno (Teste Rápido)

1. **Criar aluno de teste manualmente:**
   ```sql
   -- Como personal, você pode criar via SQL para testar
   -- Ou esperar a implementação do CRUD de alunos
   
   -- Criar aluno
   INSERT INTO public.students (personal_id, student_name, student_email, status)
   VALUES ('ID-DO-PERSONAL', 'João Aluno', 'aluno@test.com', 'active');
   
   -- Criar user para o aluno
   -- Use o magic link com o email aluno@test.com
   
   -- Depois de logar, vincular:
   UPDATE public.students 
   SET student_user_id = 'ID-DO-USER-ALUNO'
   WHERE student_email = 'aluno@test.com';
   ```

2. **Criar template de treino:**
   ```sql
   -- Primeiro criar alguns exercícios
   INSERT INTO public.exercises (personal_id, name, muscle_group)
   VALUES 
     ('ID-DO-PERSONAL', 'Supino Reto', 'Peito'),
     ('ID-DO-PERSONAL', 'Leg Press', 'Pernas'),
     ('ID-DO-PERSONAL', 'Rosca Direta', 'Bíceps');
   
   -- Criar template para segunda-feira (weekday = 1)
   INSERT INTO public.workout_templates (student_id, weekday, name)
   VALUES ('ID-DO-STUDENT', 1, 'Treino A - Peito/Bíceps');
   
   -- Adicionar exercícios ao template
   INSERT INTO public.workout_template_exercises 
     (template_id, exercise_id, sort_order, target_sets, target_reps)
   VALUES 
     ('ID-DO-TEMPLATE', 'ID-DO-SUPINO', 1, 3, '12'),
     ('ID-DO-TEMPLATE', 'ID-DA-ROSCA', 2, 3, '10');
   ```

3. **Testar como aluno:**
   - Login com email do aluno
   - Acesse `/app/student/today`
   - Registre o treino
   - Teste "Copiar última sessão"
   - Conclua o treino

## 🎯 Próximos Passos (MVP)

### Entrega 2: Gestão de Exercícios (Personal)
- [ ] Listar exercícios
- [ ] Criar novo exercício
- [ ] Editar exercício
- [ ] Deletar exercício
- [ ] Filtrar por grupo muscular

### Entrega 3: Gestão de Alunos (Personal)
- [ ] Listar alunos
- [ ] Cadastrar novo aluno (nome + email)
- [ ] Enviar convite via magic link (API com service_role)
- [ ] Ver status do aluno (invited/active)
- [ ] Ver execuções recentes do aluno

### Entrega 4: Templates de Treino (Personal)
- [ ] Ver templates por aluno
- [ ] Criar template por dia da semana
- [ ] Adicionar exercícios ao template
- [ ] Definir séries/reps alvo
- [ ] Editar/deletar templates

### Entrega 5: Histórico (Aluno + Personal)
- [ ] Aluno: ver últimos 14 dias
- [ ] Personal: ver histórico por aluno
- [ ] Filtros por data
- [ ] Detalhes de cada sessão

### Entrega 6: Dashboard e Métricas
- [ ] Aderência (treinos/semana)
- [ ] Total de treinos no mês
- [ ] Personal Records (PRs) por exercício
- [ ] Gráficos simples de evolução

### Entrega 7: Polimento Final
- [ ] Loading states consistentes
- [ ] Validações completas
- [ ] Mensagens de erro claras
- [ ] Empty states bem desenhados
- [ ] Testes básicos
- [ ] Otimizações de performance

## 🐛 Troubleshooting

### "Unauthorized" ao acessar dados
- Verifique se o RLS está ativado
- Confirme que as policies foram criadas
- Teste no SQL Editor com: `SELECT auth.uid();`

### Magic link não chega
- Verifique spam/lixeira
- Confirme SMTP configurado no Supabase
- Em dev, veja os logs no Supabase

### Redirect não funciona
- Limpe cookies do navegador
- Verifique URLs no Supabase Auth Config
- Confira logs do middleware

### Treino do dia não aparece
- Confirme que existe template para o weekday atual
- Verifique se student_user_id está vinculado
- Execute queries manualmente no SQL Editor

## 📚 Estrutura de Arquivos

```
/workspace
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts
│   │   │   └── logout/route.ts
│   │   └── student/
│   │       ├── save-workout/route.ts
│   │       ├── complete-workout/route.ts
│   │       └── copy-last-session/route.ts
│   ├── app/
│   │   ├── personal/
│   │   │   └── page.tsx
│   │   └── student/
│   │       ├── layout.tsx
│   │       └── today/
│   │           ├── page.tsx
│   │           └── TodayWorkoutClient.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── EmptyState.tsx
│   ├── LoadingSkeleton.tsx
│   └── TopNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types.ts
├── supabase/
│   └── schema.sql
├── middleware.ts
├── .env.example
├── .env.local (você deve criar)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 🎨 Design System

### Cores
- Primary: Blue (600/700)
- Success: Green (600/700)
- Error: Red (600/700)
- Gray scale: 50-900

### Spacing
- Mobile: px-4 (16px)
- Container: max-w-7xl

### Typography
- Títulos: font-bold
- Body: font-normal
- Labels: text-sm

## 📝 Convenções de Código

1. **Server Components por padrão** - Use 'use client' apenas quando necessário
2. **Supabase Server** - Use `createClient()` from `@/lib/supabase/server` em Server Components
3. **Supabase Client** - Use `createClient()` from `@/lib/supabase/client` em Client Components
4. **Validação** - Zod para todas as APIs
5. **Tipos** - TypeScript strict mode
6. **Nomenclatura** - camelCase para variáveis, PascalCase para componentes

## 🚢 Deploy (Vercel)

1. Push para GitHub
2. Conecte no Vercel
3. Configure as env vars no Vercel
4. Atualize Redirect URLs no Supabase com a URL do Vercel
5. Deploy!

---

**Status:** MVP Base funcional ✅  
**Próximo milestone:** CRUD de Exercícios e Alunos (Personal)
