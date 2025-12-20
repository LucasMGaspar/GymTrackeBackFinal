# 🔍 Troubleshooting: Erro 500 no Checkout

## Possíveis Causas do Erro 500

### 1. ❌ `MP_ACCESS_TOKEN` não configurado

**Sintoma:** Erro 500 ao tentar criar checkout

**Solução:**
1. Verifique se a variável está configurada na Vercel:
   - Vá em **Settings** → **Environment Variables**
   - Procure por `MP_ACCESS_TOKEN`
   - Se não existir, adicione com o token do Mercado Pago

2. Para desenvolvimento local, adicione no `.env.local`:
   ```bash
   MP_ACCESS_TOKEN=TEST-seu-token-aqui
   ```

3. **Importante:** Após adicionar na Vercel, faça um novo deploy!

---

### 2. ❌ Planos não existem no banco de dados

**Sintoma:** Erro 500 ou "Plan not found"

**Solução:**
Execute a migration `007_seed_plans.sql` no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/007_seed_plans.sql`
4. Copie e cole todo o conteúdo
5. Clique em **Run**

**Verificar se funcionou:**
```sql
SELECT slug, name, price_cents, is_active 
FROM public.plans;
```

Você deve ver 5 planos (free, pro-monthly, pro-yearly, business-monthly, business-yearly).

---

### 3. ❌ Tabela `subscriptions` não existe ou RLS bloqueando

**Sintoma:** Erro ao criar subscription no banco

**Solução:**
Execute a migration `006_billing_system.sql` no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/006_billing_system.sql`
4. Copie e cole todo o conteúdo
5. Clique em **Run**

**Verificar se funcionou:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('plans', 'subscriptions', 'subscription_events');
```

Você deve ver as 3 tabelas listadas.

---

### 4. ❌ Token do Mercado Pago inválido ou expirado

**Sintoma:** Erro ao criar preapproval no Mercado Pago

**Solução:**
1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá em **Suas integrações** → **Aplicações**
3. Selecione sua aplicação
4. Gere um novo **Access Token**
5. Atualize na Vercel e faça novo deploy

**Verificar se o token está correto:**
- Token de **teste** começa com `TEST-`
- Token de **produção** começa com `APP_USR-`

---

### 5. ❌ Erro na API do Mercado Pago

**Sintoma:** Erro ao criar preapproval (verificar logs)

**Possíveis causas:**
- Token inválido
- Parâmetros inválidos (valor, moeda, etc.)
- API do Mercado Pago temporariamente indisponível

**Solução:**
1. Verifique os logs do Vercel (Function Logs)
2. Procure por `[MercadoPago] Error creating preapproval`
3. Verifique a mensagem de erro específica

---

## 🔍 Como Diagnosticar

### Passo 1: Verificar Logs do Vercel

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Deployments** → Selecione o último deploy
4. Clique em **Functions** → Procure por `/api/billing/checkout`
5. Veja os logs de erro

Procure por:
- `[Checkout]` - Logs do endpoint
- `[MercadoPago]` - Logs da integração com MP
- Mensagens de erro específicas

### Passo 2: Verificar Variáveis de Ambiente

No terminal do Vercel ou localmente:

```bash
# Verificar se MP_ACCESS_TOKEN está configurado
echo $MP_ACCESS_TOKEN

# Verificar se NEXT_PUBLIC_APP_URL está configurado
echo $NEXT_PUBLIC_APP_URL
```

### Passo 3: Testar Endpoint Manualmente

Use o curl ou Postman:

```bash
curl -X POST https://seu-dominio.vercel.app/api/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: seu-cookie-de-sessao" \
  -d '{"plan_slug": "pro-monthly"}'
```

### Passo 4: Verificar Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Verificar planos
SELECT * FROM public.plans WHERE is_active = true;

-- Verificar se tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('plans', 'subscriptions', 'subscription_events');

-- Verificar RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('plans', 'subscriptions', 'subscription_events');
```

---

## 📋 Checklist Rápido

- [ ] `MP_ACCESS_TOKEN` configurado na Vercel
- [ ] `NEXT_PUBLIC_APP_URL` configurado na Vercel
- [ ] Migration `006_billing_system.sql` executada
- [ ] Migration `007_seed_plans.sql` executada
- [ ] Token do Mercado Pago é válido (não expirado)
- [ ] Tabelas `plans`, `subscriptions`, `subscription_events` existem
- [ ] RLS policies estão configuradas corretamente
- [ ] Novo deploy feito após configurar variáveis

---

## 🆘 Ainda com Problemas?

1. **Copie os logs completos** do Vercel (Function Logs)
2. **Verifique a mensagem de erro específica** na resposta da API
3. **Teste localmente** com `npm run dev` e `.env.local` configurado
4. **Verifique a documentação** do Mercado Pago para erros específicos

---

## 📝 Logs Adicionados

O código agora inclui logs detalhados em cada etapa:

- ✅ Verificação de `MP_ACCESS_TOKEN`
- ✅ Autenticação do usuário
- ✅ Busca do plano
- ✅ Verificação de subscription existente
- ✅ Criação de preapproval no Mercado Pago
- ✅ Criação de subscription no banco
- ✅ Erros detalhados com mensagens específicas

**Verifique os logs do Vercel para identificar exatamente onde está falhando!**

