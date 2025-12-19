# 🚀 Guia de Deploy - Personal Trainer SaaS

## Deploy na Vercel (Recomendado)

### Pré-requisitos
- ✅ Projeto Supabase criado e configurado
- ✅ Schema SQL executado
- ✅ Repositório Git configurado

### Passo a Passo

#### 1. Prepare o Repositório

```bash
# Adicione todos os arquivos ao git
git add .

# Faça o commit inicial
git commit -m "Initial commit: Personal Trainer SaaS MVP"

# Envie para GitHub (se ainda não enviou)
git remote add origin https://github.com/seu-usuario/seu-repo.git
git branch -M main
git push -u origin main
```

#### 2. Configure no Vercel

1. Acesse https://vercel.com
2. Clique em "Add New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

5. Clique em "Deploy"

#### 3. Configure o Supabase

Após o deploy, você receberá uma URL como: `https://seu-app.vercel.app`

1. Acesse seu projeto no Supabase
2. Vá em **Authentication > URL Configuration**
3. Adicione em **Redirect URLs**:
   - `https://seu-app.vercel.app/auth/callback`
   - `https://seu-app.vercel.app/**` (opcional, para subdomínios)

4. Atualize **Site URL** para: `https://seu-app.vercel.app`

#### 4. Teste o Deploy

1. Acesse `https://seu-app.vercel.app`
2. Tente fazer login com magic link
3. Verifique se o redirect está funcionando
4. Teste todas as funcionalidades principais

## Deploy Alternativo (Outros Serviços)

### Railway

```bash
# Instale o Railway CLI
npm i -g railway

# Login
railway login

# Inicialize
railway init

# Adicione as env vars
railway variables set NEXT_PUBLIC_SUPABASE_URL=...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
railway variables set SUPABASE_SERVICE_ROLE_KEY=...

# Deploy
railway up
```

### Netlify

1. Conecte o repositório GitHub
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Adicione as variáveis de ambiente
4. Deploy

### Docker (Self-hosted)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

```bash
# Build
docker build -t personal-trainer-saas .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  personal-trainer-saas
```

## Configurações de Produção

### Supabase - Configurações Importantes

#### 1. Email Auth Templates
Personalize os templates de email em **Authentication > Email Templates**

#### 2. Rate Limiting
Configure em **Authentication > Settings**:
- Rate limit: 10 emails por hora (ajuste conforme necessário)

#### 3. Database Backups
Configure backups automáticos em **Database > Backups**

#### 4. RLS (Row Level Security)
Verifique se todas as policies estão ativas:
```sql
-- Execute no SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Next.js - Otimizações

#### 1. Adicionar output standalone
Edite `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // Para Docker/self-hosted
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
```

#### 2. Configurar rewrites (se necessário)
Para URLs amigáveis ou proxies.

### Monitoramento

#### Vercel Analytics
Adicione ao seu projeto:

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "your-sentry-dsn",
  tracesSampleRate: 1.0,
});
```

## Segurança em Produção

### Checklist de Segurança

- [ ] RLS habilitado em todas as tabelas
- [ ] Service Role Key NUNCA exposta no client
- [ ] HTTPS obrigatório (Vercel fornece automaticamente)
- [ ] CSP Headers configurados (Content Security Policy)
- [ ] Rate limiting ativo no Supabase Auth
- [ ] Validação Zod em todas as APIs
- [ ] CORS configurado corretamente
- [ ] Logs de erro configurados

### Headers de Segurança

Adicione em `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## Performance

### Otimizações Recomendadas

1. **Imagens**: Use `next/image` para otimização automática
2. **Fonts**: Use `next/font` para fontes locais
3. **Caching**: Configure corretamente no Supabase
4. **Database Indexes**: Já implementados no schema.sql
5. **CDN**: Vercel fornece automaticamente

### Monitorar Performance

```bash
# Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --upload.target=temporary-public-storage
```

## Rollback

### Vercel
1. Acesse o dashboard do projeto
2. Vá em "Deployments"
3. Clique nos 3 pontos do deploy anterior
4. Selecione "Promote to Production"

### Git
```bash
# Ver commits
git log --oneline

# Reverter para commit anterior
git revert <commit-hash>
git push
```

## Custos Estimados

### Tier Gratuito
- **Vercel**: Grátis até 100GB bandwidth/mês
- **Supabase**: Grátis até 500MB database, 2GB bandwidth, 50k usuários
- **Total**: R$ 0/mês (até os limites)

### Tier Pago (Estimativa)
- **Vercel Pro**: $20/mês
- **Supabase Pro**: $25/mês
- **Total**: ~$45/mês (R$ 225/mês)

## Manutenção

### Atualizações
```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix
```

### Backup Manual
```bash
# Exportar dados do Supabase
# Use o SQL Editor:
COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' CSV HEADER;
COPY (SELECT * FROM students) TO '/tmp/students.csv' CSV HEADER;
# etc...
```

### Logs
```bash
# Vercel logs
vercel logs

# Logs em tempo real
vercel logs --follow
```

## Troubleshooting

### Problema: Magic Link não chega
**Solução:**
- Verifique configuração SMTP no Supabase
- Confira Redirect URLs
- Veja logs em Authentication > Logs

### Problema: RLS bloqueando queries
**Solução:**
```sql
-- Desabilitar temporariamente para debug (APENAS EM DEV!)
ALTER TABLE nome_tabela DISABLE ROW LEVEL SECURITY;

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'nome_tabela';
```

### Problema: Deploy falha
**Solução:**
- Verifique erros de build no Vercel
- Execute `npm run build` localmente
- Confirme que todas as env vars estão configuradas

## Próximos Passos Pós-Deploy

1. [ ] Configurar domínio customizado
2. [ ] Adicionar analytics
3. [ ] Configurar error tracking
4. [ ] Implementar testes E2E
5. [ ] Setup CI/CD com GitHub Actions
6. [ ] Documentar APIs (Swagger/OpenAPI)
7. [ ] Adicionar rate limiting nas APIs
8. [ ] Configurar uptime monitoring

---

**Pronto para produção?** ✅  
Siga este checklist e seu MVP estará no ar em menos de 30 minutos!
