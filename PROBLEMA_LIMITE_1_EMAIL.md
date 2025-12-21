# ⚠️ Problema: Só Consegue Enviar para 1 Email

## 🔍 Causa Provável

O Supabase tem **rate limits** (limites de taxa) para envio de emails, especialmente no plano gratuito.

### Limites do Plano Gratuito do Supabase:
- **4 emails por hora** (sem SMTP customizado)
- **30 emails por hora** (com SMTP customizado habilitado)

### Limites do Resend Gratuito:
- **3.000 emails por mês**
- **Sem limite por hora** (mas pode ter throttling)

## ✅ Soluções

### 1. Verificar Rate Limit no Supabase

**No Supabase Dashboard:**
1. Vá em **Settings** → **Auth** → **SMTP Settings**
2. Veja o campo **"Minimum interval per user"** (deve estar em 60 segundos)
3. Isso significa: **1 email por minuto por usuário**

### 2. Ajustar Intervalo Mínimo (Se Disponível)

Se o Supabase permitir, tente reduzir o intervalo:
- **Minimum interval per user:** Tente `10` ou `20` segundos (se permitido)
- Mas o limite de 30 emails/hora ainda se aplica

### 3. Verificar Rate Limit do Resend

No Resend Dashboard:
1. Vá em **Emails** → **Activity**
2. Verifique se há throttling ou rate limits sendo aplicados
3. Plano gratuito pode ter throttling se enviar muitos emails de uma vez

### 4. Esperar Entre Envios

Se o problema é rate limiting:
- **Aguarde 60 segundos** entre cada envio de email
- Ou envie em lotes pequenos (ex: 5 emails, aguardar 1 minuto, mais 5 emails)

### 5. Verificar Logs

**No Supabase Dashboard:**
1. Vá em **Logs** → **Auth Logs**
2. Procure por erros relacionados a rate limiting
3. Mensagens comuns:
   - "Rate limit exceeded"
   - "Too many requests"
   - "Email sending quota exceeded"

### 6. Upgrade do Plano (Se Necessário)

Se precisar enviar mais emails:
- **Supabase Pro:** Aumenta limite de emails
- **Resend Pro:** $20/mês para 50k emails (sem throttling)

## 🔍 Como Diagnosticar

### Teste 1: Verificar se é Rate Limit
1. Envie email para email1@teste.com
2. **Aguarde 60 segundos**
3. Tente enviar para email2@teste.com
4. Se funcionar, é rate limiting

### Teste 2: Verificar Logs
No Supabase: **Logs** → **Auth Logs**
- Procure mensagens de erro
- Veja timestamps dos envios
- Identifique padrões

### Teste 3: Testar no Resend Dashboard
1. No Resend: **Emails** → **Send Email**
2. Envie um email de teste diretamente
3. Se funcionar, o problema está no Supabase, não no Resend

## ✅ Solução Temporária

Enquanto não resolve o rate limiting:

1. **Envie emails em lotes pequenos**
   - 5-10 emails por vez
   - Aguarde 2-3 minutos entre lotes

2. **Use links diretos**
   - Gere os links na interface
   - Envie manualmente via WhatsApp/SMS

3. **Desabilite "Confirm email" temporariamente**
   - Para testes internos
   - Não requer envio de emails

## 📝 Notas Importantes

- **Supabase Free**: 30 emails/hora (com SMTP customizado)
- **Supabase Pro**: 100 emails/hora
- **Resend Free**: 3.000 emails/mês (mas pode ter throttling)
- **Rate limiting é por hora**, não por dia

## 🔧 Configuração Recomendada

Para evitar problemas:

1. **Minimum interval per user:** 60 segundos (padrão)
2. **Enviar em lotes:** Máximo 10 emails, aguardar 2 minutos
3. **Monitorar logs:** Verificar se há erros de rate limit
4. **Upgrade se necessário:** Se precisar de mais emails

