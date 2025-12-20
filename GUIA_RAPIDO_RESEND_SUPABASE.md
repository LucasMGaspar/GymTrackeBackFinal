# ⚡ Guia Rápido: Configurar Resend no Supabase

## 🎯 Passo a Passo

### 1. Criar Conta no Resend
- Acesse: https://resend.com/signup
- Crie conta gratuita
- Verifique seu email

### 2. Obter API Key
- No Resend Dashboard: **API Keys** → **Create API Key**
- Nome: "Supabase SMTP"
- Permissão: Sending access
- **Copie a API key** (começa com `re_...`)

### 3. Configurar no Supabase

**Localização:**
Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings**

**Preencha EXATAMENTE assim:**

| Campo | Valor |
|-------|-------|
| **Host** | `smtp.resend.com` |
| **Port** | `587` ⚠️ **IMPORTANTE: Use 587, não 465!** |
| **Username** | `resend` |
| **Password** | `[cole sua API key aqui]` ← Sem prefixos, apenas a key |
| **Sender email** | `onboarding@resend.dev` (para testes) |
| **Sender name** | `FitCoach Pro` |

### 4. Salvar e Testar
1. Clique em **"Save changes"**
2. Aguarde 5-10 segundos
3. Envie um convite de teste
4. Verifique a caixa de entrada (e spam)

## ❌ Erros Comuns

### Erro: "No API key found"
**Causa:** API key não está configurada corretamente

**Solução:**
- Certifique-se que copiou a API key completa (começa com `re_...`)
- Não coloque "apikey:" ou qualquer prefixo
- Use porta **587** (não 465)

### Email não chega
**Verifique:**
- ✅ Pasta de spam
- ✅ Se o sender email está correto (`onboarding@resend.dev` para testes)
- ✅ Se a API key está ativa no Resend
- ✅ Rate limits (Resend gratuito: 3.000 emails/mês)

## ✅ Configuração Correta Visual

```
┌─────────────────────────────────────────┐
│ Enable custom SMTP          [✓ ON]     │
├─────────────────────────────────────────┤
│ Sender email:                           │
│ onboarding@resend.dev                  │
│                                         │
│ Sender name:                            │
│ FitCoach Pro                            │
│                                         │
│ Host:                                   │
│ smtp.resend.com                        │
│                                         │
│ Port:                                   │
│ 587  ← USE 587!                        │
│                                         │
│ Username:                               │
│ resend                                 │
│                                         │
│ Password:                               │
│ re_abc123xyz...  ← Apenas a API key   │
└─────────────────────────────────────────┘
```

## 🔍 Como Verificar se Funcionou

1. **Envie um convite** pela interface
2. **Verifique os logs** no Resend Dashboard (emails enviados)
3. **Verifique a caixa de entrada** do destinatário
4. **Se não chegar:** verifique spam e rate limits

## 📊 Limites Gratuitos

- **Resend Gratuito:** 3.000 emails/mês
- **Supabase Gratuito:** 4 emails/hora (com SMTP customizado: 30 emails/hora)

## 🚀 Para Produção

Quando estiver em produção:
1. **Verifique um domínio** no Resend
2. **Use o domínio verificado** como sender (ex: `noreply@seu-dominio.com`)
3. Isso melhora a deliverability

