# ✅ Checklist de Configuração do Sistema de Billing

## Status Atual
- ✅ Migration `006_billing_system.sql` executada com sucesso
- ⏳ Próximos passos abaixo

---

## 📋 Próximos Passos

### 1. Executar Seed de Planos ⏳

Execute a migration `007_seed_plans.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/007_seed_plans.sql`
4. Copie e cole todo o conteúdo
5. Clique em **Run** ou **Execute**

Isso criará os planos padrão:
- Free (Gratuito)
- Pro Mensal
- Pro Anual
- Business Mensal
- Business Anual

---

### 2. Configurar Variáveis de Ambiente ⏳

#### Desenvolvimento Local

Crie/edite o arquivo `.env.local` na raiz do projeto:

```bash
# Mercado Pago Access Token
MP_ACCESS_TOKEN=TEST-seu-token-de-teste-aqui

# URL da aplicação (para redirects após checkout)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Produção (Vercel)

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:

   | Nome | Valor | Ambiente |
   |------|-------|----------|
   | `MP_ACCESS_TOKEN` | `APP_USR-seu-token-de-producao` | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.vercel.app` | Production, Preview, Development |

5. Clique em **Save**
6. Faça um novo deploy para aplicar

---

### 3. Obter Access Token do Mercado Pago ⏳

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login
3. Vá em **Suas integrações** → **Aplicações**
4. Crie uma nova aplicação (se ainda não tiver)
5. Copie o **Access Token**:
   - **Teste**: Começa com `TEST-` (use para desenvolvimento)
   - **Produção**: Começa com `APP_USR-` (use apenas em produção)

---

### 4. Configurar Webhook no Mercado Pago ⏳

#### Para Produção

1. Acesse [Painel de Aplicações do MP](https://www.mercadopago.com.br/developers/panel/app)
2. Selecione sua aplicação
3. Vá em **Webhooks** ou **Notificações**
4. Adicione a URL:
   ```
   https://seu-dominio.vercel.app/api/webhooks/mercadopago
   ```
5. Selecione os eventos:
   - ✅ **Preapproval** (todos os eventos)
6. Clique em **Salvar**

#### Para Desenvolvimento Local (usando ngrok)

1. Instale o ngrok: https://ngrok.com/download
2. Inicie o servidor: `npm run dev`
3. Em outro terminal: `ngrok http 3000`
4. Copie a URL HTTPS do ngrok (ex: `https://abc123.ngrok.io`)
5. Configure no MP: `https://abc123.ngrok.io/api/webhooks/mercadopago`

---

### 5. Testar o Sistema ✅

#### Teste 1: Verificar Planos

1. Acesse: `http://localhost:3000/app/personal/plans`
2. Você deve ver os planos listados

#### Teste 2: Testar Checkout

1. Clique em **"Assinar"** em um plano
2. Deve redirecionar para o checkout do Mercado Pago
3. Complete o pagamento de teste
4. Deve voltar para `/app/personal/billing?status=success`

#### Teste 3: Verificar Assinatura

1. Acesse: `http://localhost:3000/app/personal/billing`
2. Deve mostrar o status da assinatura

---

## 🔍 Verificações

Execute estas queries no Supabase SQL Editor para verificar:

```sql
-- Verificar se os planos foram criados
SELECT slug, name, price_cents, interval, is_active 
FROM public.plans 
ORDER BY price_cents;

-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('plans', 'subscriptions', 'subscription_events');

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('plans', 'subscriptions', 'subscription_events');
```

---

## 📚 Documentação

- [README_BILLING.md](./README_BILLING.md) - Documentação completa do sistema
- [SETUP_MERCADOPAGO.md](./SETUP_MERCADOPAGO.md) - Guia passo a passo do Mercado Pago

---

## ⚠️ Importante

- ✅ Use token de **TESTE** para desenvolvimento
- ✅ Use token de **PRODUÇÃO** apenas em produção
- ✅ **NUNCA** commite o `.env.local` no Git
- ✅ Mantenha o Access Token secreto

---

## 🎉 Pronto!

Após completar todos os passos, seu sistema de billing estará funcionando!


