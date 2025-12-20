# Como Cancelar a Assinatura

## 📍 Onde Cancelar

A funcionalidade de cancelamento está disponível na página de **Faturamento**:

**Caminho:** `/app/personal/billing`

Você pode acessar através do menu lateral ou diretamente pela URL.

## 🔄 Como Funciona

### **1. Acesse a Página de Faturamento**

- Faça login como Personal Trainer
- Navegue até a página de Faturamento (`/app/personal/billing`)

### **2. Opções de Cancelamento**

Na página de Faturamento, você verá **duas opções de cancelamento**:

#### **Opção 1: Cancelar ao Fim do Período** ⏰
- **Botão:** "Cancelar ao Fim do Período" (botão cinza)
- **O que acontece:**
  - Você continua com acesso até o fim do período atual
  - A assinatura será cancelada automaticamente na data de `current_period_end`
  - Você não será cobrado no próximo ciclo
  - **Recomendado:** Permite usar o serviço até o fim do período pago

#### **Opção 2: Cancelar Imediatamente** ⚠️
- **Botão:** "Cancelar Imediatamente" (botão vermelho)
- **O que acontece:**
  - O acesso é cancelado **imediatamente**
  - A assinatura muda para status `canceled`
  - Você perde o acesso agora mesmo
  - **Atenção:** Você não receberá reembolso pelo período restante

### **3. Confirmação**

Ambas as opções pedem confirmação antes de cancelar:

- **Cancelar ao Fim do Período:**
  > "Tem certeza que deseja cancelar a assinatura? Ela será cancelada ao fim do período atual."

- **Cancelar Imediatamente:**
  > "Tem certeza que deseja cancelar imediatamente? Você perderá o acesso agora."

## 🔧 O que Acontece Tecnicamente

### **Quando você cancela:**

1. **No Mercado Pago:**
   - O sistema cancela o `preapproval` no Mercado Pago
   - Isso impede futuras cobranças automáticas

2. **No Banco de Dados:**
   - Se **cancelar ao fim do período:**
     - `cancel_at_period_end` = `true`
     - `status` permanece como está (ex: `active`, `trialing`)
     - `canceled_at` = `null`
   
   - Se **cancelar imediatamente:**
     - `status` = `canceled`
     - `canceled_at` = data/hora atual
     - `cancel_at_period_end` = `false`

3. **Acesso ao Sistema:**
   - Status `canceled`: ❌ Sem acesso
   - Status `active` com `cancel_at_period_end = true`: ✅ Acesso até o fim do período

## 📋 Status da Assinatura Após Cancelamento

### **Cancelado ao Fim do Período:**
```
Status: active (ou trialing)
cancel_at_period_end: true
canceled_at: null
Acesso: ✅ Ativo até current_period_end
```

### **Cancelado Imediatamente:**
```
Status: canceled
cancel_at_period_end: false
canceled_at: 2024-01-15T10:30:00Z
Acesso: ❌ Imediatamente bloqueado
```

## 🔄 Reativar Assinatura

Se você cancelou ao fim do período e mudou de ideia:

1. Acesse `/app/personal/plans`
2. Escolha um plano
3. Faça a assinatura novamente
4. O sistema criará uma nova subscription

**Nota:** Não há botão de "Reativar" - você precisa criar uma nova assinatura.

## 🚨 Importante

- **Cancelar ao fim do período** é a opção mais segura - você não perde acesso imediatamente
- **Cancelar imediatamente** é irreversível - você perde acesso na hora
- Após cancelar, você pode criar uma nova assinatura a qualquer momento
- O cancelamento no Mercado Pago impede futuras cobranças automáticas

## 📍 Código Relacionado

- **API:** `app/api/billing/cancel/route.ts`
- **UI:** `app/app/personal/billing/BillingClient.tsx`
- **Função MP:** `lib/mercadopago/client.ts` → `cancelPreApproval()`

## 🧪 Como Testar

1. Acesse `/app/personal/billing`
2. Verifique se há uma assinatura ativa
3. Clique em "Cancelar ao Fim do Período"
4. Confirme o cancelamento
5. Verifique que `cancel_at_period_end` está como `true`
6. O status deve continuar como `active` ou `trialing`
7. A data de `current_period_end` mostra quando o acesso será encerrado

