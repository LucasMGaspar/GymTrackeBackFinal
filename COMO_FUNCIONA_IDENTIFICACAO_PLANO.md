# Como Funciona a Identificação do Plano do Personal Trainer

## 📋 Resumo

**O plano é identificado através da tabela `subscriptions` e o status determina quando as funcionalidades são liberadas.**

## 🔍 Como o Sistema Identifica o Plano

### 1. **Verificação da Subscription Ativa**

O sistema identifica o plano do personal trainer através da tabela `subscriptions` no Supabase:

```sql
SELECT * FROM subscriptions
WHERE personal_id = 'user_id'
  AND status IN ('trialing', 'active', 'past_due', 'pending')
ORDER BY created_at DESC
LIMIT 1;
```

**Status considerados como "ativos":**
- `trialing` - Período de teste (trial)
- `active` - Assinatura ativa e paga
- `past_due` - Pagamento em atraso (mas ainda tem acesso)
- `pending` - Aguardando confirmação do pagamento

### 2. **Onde a Subscription é Verificada**

#### **API Endpoint: `/api/billing/subscription`**
```typescript
// Retorna a subscription ativa com os dados do plano
GET /api/billing/subscription
```

Retorna:
```json
{
  "subscription": {
    "id": "...",
    "plan_id": "...",
    "status": "active",
    "plan": {
      "id": "...",
      "slug": "pro-monthly",
      "name": "Pro Mensal",
      "features": {
        "max_students": 50,
        "max_exercises": 500,
        ...
      }
    }
  },
  "has_active_subscription": true
}
```

#### **Páginas que verificam a subscription:**
- `app/app/personal/plans/page.tsx` - Mostra planos e subscription atual
- `app/app/personal/billing/page.tsx` - Mostra detalhes da assinatura

## ⏱️ Quando o Plano é Liberado?

### **Fluxo Completo:**

#### **1. Checkout (Criação da Subscription)**
Quando o personal trainer clica em "Assinar Agora":

```typescript
POST /api/billing/checkout
{
  "plan_slug": "pro-monthly"
}
```

**O que acontece:**
1. ✅ Cria um **preapproval** no Mercado Pago
2. ✅ Cria um registro na tabela `subscriptions` com status:
   - `trialing` - Se o plano tem `trial_days` (ex: 7 dias grátis)
   - `pending` - Se não tem trial

**⚠️ IMPORTANTE:** A subscription é criada **ANTES** do pagamento ser processado!

```typescript
// app/api/billing/checkout/route.ts (linha 188)
status: plan.trial_days ? 'trialing' : 'pending',
```

#### **2. Redirecionamento para Mercado Pago**
O usuário é redirecionado para o checkout do Mercado Pago:
```typescript
window.location.href = data.checkout_url;
```

#### **3. Processamento do Pagamento**
O usuário completa o pagamento no Mercado Pago.

#### **4. Webhook do Mercado Pago**
Após o pagamento, o Mercado Pago envia um webhook:

```typescript
POST /api/webhooks/mercadopago
```

**O que o webhook faz:**
1. Recebe o evento do Mercado Pago
2. Busca a subscription pelo `mp_preapproval_id`
3. Verifica o status no Mercado Pago
4. **Atualiza o status da subscription:**

```typescript
// app/api/webhooks/mercadopago/route.ts (linha 174-175)
if (eventType === 'authorized' || mpStatus === 'authorized') {
  updateData.status = 'active'; // ✅ PLANO LIBERADO!
}
```

## 🎯 Status da Subscription e Acesso

| Status | Acesso Liberado? | Quando Ocorre |
|--------|------------------|---------------|
| `trialing` | ✅ **SIM** | Plano com trial (ex: 7 dias grátis) |
| `active` | ✅ **SIM** | Pagamento confirmado pelo Mercado Pago |
| `pending` | ⚠️ **DEPENDE** | Aguardando confirmação do pagamento |
| `past_due` | ✅ **SIM** | Pagamento em atraso (acesso mantido temporariamente) |
| `canceled` | ❌ **NÃO** | Assinatura cancelada |
| `paused` | ❌ **NÃO** | Assinatura pausada |

## 🔐 Verificação de Limites do Plano

**⚠️ ATENÇÃO:** Atualmente, o sistema **NÃO está verificando os limites do plano** (max_students, max_exercises) ao criar alunos ou exercícios!

### **Onde DEVERIA verificar (mas não está implementado):**

#### **1. Ao Criar Aluno**
```typescript
// app/api/personal/students/route.ts
// ❌ NÃO verifica max_students antes de criar
```

#### **2. Ao Criar Exercício**
```typescript
// app/api/personal/exercises/route.ts
// ❌ NÃO verifica max_exercises antes de criar
```

### **Como Implementar a Verificação:**

```typescript
// Exemplo de verificação antes de criar aluno
const { data: subscription } = await supabase
  .from('subscriptions')
  .select(`
    *,
    plan:plans(*)
  `)
  .eq('personal_id', user.id)
  .in('status', ['trialing', 'active', 'past_due'])
  .single();

if (!subscription) {
  return NextResponse.json(
    { error: 'Você precisa de uma assinatura ativa' },
    { status: 403 }
  );
}

const maxStudents = subscription.plan.features.max_students;
if (maxStudents !== -1) {
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('personal_id', user.id)
    .eq('status', 'active');
  
  if (count && count >= maxStudents) {
    return NextResponse.json(
      { error: `Limite de ${maxStudents} alunos atingido. Faça upgrade do plano.` },
      { status: 403 }
    );
  }
}
```

## 📊 Resumo do Fluxo

```
1. Personal Trainer clica em "Assinar Agora"
   ↓
2. Sistema cria subscription com status 'trialing' ou 'pending'
   ↓
3. Redireciona para checkout do Mercado Pago
   ↓
4. Usuário completa o pagamento
   ↓
5. Mercado Pago envia webhook
   ↓
6. Sistema atualiza subscription para 'active'
   ↓
7. ✅ PLANO LIBERADO - Personal trainer tem acesso completo
```

## ⚠️ Pontos Importantes

1. **Subscription é criada ANTES do pagamento** - Status inicial pode ser `trialing` ou `pending`
2. **Plano só é totalmente liberado quando status = 'active'** - Isso acontece via webhook após pagamento
3. **Trial libera acesso imediatamente** - Se o plano tem `trial_days`, o status é `trialing` e o acesso é liberado
4. **Limites NÃO estão sendo verificados** - O sistema não impede criação de alunos/exercícios além do limite do plano
5. **Webhook é essencial** - Sem o webhook funcionando, o status pode ficar em `pending` mesmo após pagamento

## 🔧 Como Verificar se Está Funcionando

### **1. Verificar Subscription no Banco:**
```sql
SELECT 
  s.id,
  s.status,
  s.mp_preapproval_id,
  p.name as plan_name,
  p.features
FROM subscriptions s
JOIN plans p ON p.id = s.plan_id
WHERE s.personal_id = 'seu_user_id'
ORDER BY s.created_at DESC;
```

### **2. Verificar Webhook:**
```sql
SELECT 
  event_id,
  event_type,
  processed_at,
  processing_error
FROM subscription_events
WHERE subscription_id = 'sua_subscription_id'
ORDER BY created_at DESC;
```

### **3. Testar API:**
```bash
curl -X GET https://seu-app.com/api/billing/subscription \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🚨 Problemas Comuns

### **1. Subscription fica em 'pending' mesmo após pagamento**
- **Causa:** Webhook não está sendo recebido ou está falhando
- **Solução:** Verificar logs do webhook e configuração no Mercado Pago

### **2. Personal trainer não tem acesso mesmo com subscription 'active'**
- **Causa:** Verificação de subscription não está sendo feita nas rotas
- **Solução:** Implementar verificação de subscription nas APIs que precisam

### **3. Limites do plano não são respeitados**
- **Causa:** Verificação de limites não está implementada
- **Solução:** Implementar verificação antes de criar alunos/exercícios

