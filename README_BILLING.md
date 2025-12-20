# 💳 Sistema de Faturamento e Assinaturas - Mercado Pago

Este documento descreve o sistema de planos e assinaturas integrado com Mercado Pago.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [APIs](#apis)
- [Webhooks](#webhooks)
- [Fluxos](#fluxos)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema permite que personal trainers assinem planos (Free, Pro, Business) com pagamentos recorrentes via Mercado Pago. Inclui:

- ✅ Planos configuráveis com limites de features
- ✅ Assinaturas recorrentes (mensais/anuais)
- ✅ Períodos de teste (trial)
- ✅ Webhooks para atualização automática de status
- ✅ Idempotência e replay-safe nos webhooks
- ✅ Troca de planos (upgrade/downgrade)
- ✅ Cancelamento (imediato ou ao fim do período)

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no seu `.env.local` e na Vercel:

```bash
# Mercado Pago
MP_ACCESS_TOKEN=seu_access_token_aqui

# App URL (para webhooks e redirects)
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
# ou
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

### 2. Obter Access Token do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Copie o **Access Token** (Production ou Test)
4. Adicione no `.env.local` como `MP_ACCESS_TOKEN`

### 3. Executar Migrações

Execute as migrações SQL no Supabase SQL Editor:

1. `supabase/migrations/006_billing_system.sql` - Cria tabelas
2. `supabase/migrations/007_seed_plans.sql` - Cria planos padrão

```sql
-- No Supabase SQL Editor, execute:
-- 1. Copie e execute o conteúdo de 006_billing_system.sql
-- 2. Copie e execute o conteúdo de 007_seed_plans.sql
```

### 4. Configurar Webhook no Mercado Pago

1. Acesse [Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app)
2. Adicione a URL do webhook:
   ```
   https://seu-dominio.vercel.app/api/webhooks/mercadopago
   ```
3. Selecione os eventos:
   - `preapproval` (todos os eventos relacionados)
   - `payment` (opcional, se usar pagamentos avulsos)

**Para desenvolvimento local:**

Use [ngrok](https://ngrok.com/) para expor seu servidor local:

```bash
ngrok http 3000
```

Use a URL do ngrok no webhook do Mercado Pago:
```
https://seu-ngrok-url.ngrok.io/api/webhooks/mercadopago
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas

#### `plans`
Armazena os planos disponíveis.

```sql
- id (UUID)
- slug (TEXT, UNIQUE) - ex: 'pro-monthly'
- name (TEXT) - ex: 'Pro Mensal'
- description (TEXT)
- price_cents (INTEGER) - preço em centavos
- currency (TEXT) - 'BRL', 'USD', 'EUR'
- interval (TEXT) - 'month' ou 'year'
- trial_days (INTEGER, NULLABLE) - dias de teste grátis
- features (JSONB) - limites e features do plano
- is_active (BOOLEAN)
- created_at, updated_at
```

#### `subscriptions`
Armazena assinaturas ativas e históricas.

```sql
- id (UUID)
- personal_id (UUID, FK -> profiles.id)
- plan_id (UUID, FK -> plans.id)
- status (TEXT) - 'trialing', 'active', 'past_due', 'canceled', 'paused', 'unpaid', 'incomplete', 'pending'
- mp_preapproval_id (TEXT, UNIQUE) - ID do preapproval no MP
- mp_subscription_id (TEXT, UNIQUE) - ID da subscription no MP (se usar Subscription API)
- mp_customer_id (TEXT) - ID do customer no MP
- current_period_start (TIMESTAMPTZ)
- current_period_end (TIMESTAMPTZ)
- cancel_at_period_end (BOOLEAN)
- canceled_at (TIMESTAMPTZ, NULLABLE)
- trial_start, trial_end (TIMESTAMPTZ, NULLABLE)
- created_at, updated_at
```

#### `subscription_events`
Event store para auditoria de webhooks.

```sql
- id (UUID)
- provider (TEXT) - 'mercadopago'
- event_id (TEXT) - ID do evento do MP
- dedupe_key (TEXT, UNIQUE, GENERATED) - Chave de idempotência
- event_type (TEXT) - Tipo do evento
- subscription_id (UUID, FK -> subscriptions.id, NULLABLE)
- payload (JSONB) - Payload completo do webhook
- processed_at (TIMESTAMPTZ, NULLABLE)
- processing_error (TEXT, NULLABLE)
- created_at
```

## 🔌 APIs

### GET `/api/plans`
Lista todos os planos ativos.

**Resposta:**
```json
{
  "plans": [
    {
      "id": "...",
      "slug": "pro-monthly",
      "name": "Pro Mensal",
      "price_cents": 9900,
      "currency": "BRL",
      "interval": "month",
      "trial_days": 7,
      "features": { ... }
    }
  ]
}
```

### POST `/api/billing/checkout`
Cria sessão de checkout no Mercado Pago.

**Request:**
```json
{
  "plan_slug": "pro-monthly"
}
```

**Resposta:**
```json
{
  "success": true,
  "checkout_url": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "subscription_id": "...",
  "preapproval_id": "..."
}
```

### GET `/api/billing/subscription`
Retorna status da assinatura atual.

**Resposta:**
```json
{
  "subscription": {
    "id": "...",
    "status": "active",
    "plan": { ... },
    "current_period_end": "2024-02-01T00:00:00Z"
  },
  "has_active_subscription": true
}
```

### POST `/api/billing/cancel`
Cancela assinatura.

**Request:**
```json
{
  "immediate": false  // true para cancelar imediatamente
}
```

**Resposta:**
```json
{
  "success": true,
  "subscription": { ... },
  "message": "Subscription will be canceled at the end of the current period"
}
```

### POST `/api/billing/switch-plan`
Troca de plano.

**Request:**
```json
{
  "plan_slug": "business-monthly"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Upgrade successful. Please complete the checkout.",
  "checkout_url": "...",
  "subscription": { ... }
}
```

**Política de troca:**
- **Upgrade**: Cancelamento imediato do plano atual e criação de novo checkout
- **Downgrade**: Agendamento para fim do período atual

### POST `/api/webhooks/mercadopago`
Endpoint para receber webhooks do Mercado Pago.

**Características:**
- ✅ Idempotência via `dedupe_key`
- ✅ Validação de eventos
- ✅ Atualização automática de status
- ✅ Logging completo para auditoria
- ✅ Replay-safe (eventos duplicados são ignorados)

## 🔄 Fluxos

### Fluxo de Checkout

1. Usuário clica em "Assinar" em um plano
2. Frontend chama `POST /api/billing/checkout` com `plan_slug`
3. Backend:
   - Valida plano existe e está ativo
   - Verifica se usuário já tem assinatura ativa
   - Cria customer no MP (se necessário)
   - Cria preapproval no MP
   - Cria registro de subscription com status `pending` ou `trialing`
   - Retorna `checkout_url`
4. Frontend redireciona para `checkout_url`
5. Usuário completa pagamento no Mercado Pago
6. Mercado Pago redireciona de volta para `/app/personal/billing?status=success`
7. Webhook do MP atualiza status para `active`

### Fluxo de Webhook

1. Mercado Pago envia webhook para `/api/webhooks/mercadopago`
2. Backend:
   - Valida assinatura (básica)
   - Gera `dedupe_key` do evento
   - Verifica se evento já foi processado (idempotência)
   - Armazena evento em `subscription_events`
   - Busca subscription pelo `mp_preapproval_id`
   - Consulta status atual no MP via API
   - Atualiza `subscriptions` com novo status
   - Marca evento como processado
3. Retorna 200 (sempre, para evitar retries)

### Fluxo de Troca de Plano

**Upgrade:**
1. Usuário seleciona plano mais caro
2. Backend cancela assinatura atual imediatamente
3. Cria nova assinatura e checkout
4. Usuário completa checkout
5. Novo plano ativo imediatamente

**Downgrade:**
1. Usuário seleciona plano mais barato
2. Backend marca `cancel_at_period_end = true`
3. Plano atual continua até fim do período
4. Ao fim do período, criar job/cron para aplicar downgrade

## 🧪 Testes

### Testes Manuais

1. **Testar Checkout:**
   ```bash
   curl -X POST http://localhost:3000/api/billing/checkout \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"plan_slug": "pro-monthly"}'
   ```

2. **Testar Webhook (usando ngrok):**
   - Configure webhook no MP apontando para seu ngrok
   - Crie uma assinatura de teste
   - Verifique logs no console
   - Verifique tabela `subscription_events`

3. **Testar Cancelamento:**
   ```bash
   curl -X POST http://localhost:3000/api/billing/cancel \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"immediate": false}'
   ```

### Testes Automatizados

Execute os testes:

```bash
npm test -- lib/billing/__tests__
```

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. Verifique se a URL está correta no painel do MP
2. Use ngrok para desenvolvimento local
3. Verifique logs do servidor
4. Verifique tabela `subscription_events` para ver se eventos estão chegando

### Status não atualiza após pagamento

1. Verifique se webhook está configurado corretamente
2. Verifique logs do webhook handler
3. Verifique se `mp_preapproval_id` está correto na subscription
4. Teste manualmente consultando status no MP e atualizando

### Erro "Plan not found"

1. Verifique se seed foi executado (`007_seed_plans.sql`)
2. Verifique se `plan_slug` está correto
3. Verifique se plano está `is_active = true`

### Erro "Already have active subscription"

1. Verifique status da subscription atual
2. Se necessário, cancele a subscription atual primeiro
3. Ou use `/api/billing/switch-plan` para trocar

## 📚 Recursos Adicionais

- [Documentação Mercado Pago - Preapproval](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/subscriptions-and-preapprovals)
- [Mercado Pago SDK Node.js](https://github.com/mercadopago/sdk-nodejs)

## 🔒 Segurança

- ✅ Validação de autenticação em todas as APIs
- ✅ Validação de planos sempre do banco (nunca confiar no client)
- ✅ Rate limiting em todos os endpoints
- ✅ Idempotência nos webhooks
- ✅ Logging completo para auditoria
- ⚠️ Webhook validation pode ser melhorada (verificar IP ranges do MP)

## 📝 Notas

- O sistema usa **Preapproval** do Mercado Pago para assinaturas recorrentes
- Status são mapeados de MP para interno automaticamente
- Eventos são armazenados para auditoria e debug
- Downgrade requer job/cron para aplicar ao fim do período (não implementado ainda)


