# 🔧 Como Corrigir Erro "No API key found" no Resend

## ⚠️ Erro
```
"No API key found in request"
"No `apikey` request header or url param was found."
```

## 🎯 Causa
O Supabase usa SMTP, não a API REST do Resend. A configuração deve ser diferente.

## ✅ Solução Correta para Resend no Supabase

### Configuração SMTP do Resend:

No Supabase Dashboard → Settings → Auth → SMTP Settings:

```
Host: smtp.resend.com
Port: 587  (⚠️ Use 587, não 465!)
Username: resend
Password: [SUA_API_KEY_DO_RESEND]  ← Cole a API key aqui (não coloque "apikey:" na frente)
Sender email: onboarding@resend.dev (para testes)
Sender name: FitCoach Pro
```

### ⚠️ Erros Comuns:

1. **Usar porta 465**: Resend funciona melhor com 587
2. **Colocar "apikey:" antes da API key**: Não precisa, apenas a key
3. **Usar API key errada**: Use a key que começa com `re_...`
4. **Email sender inválido**: Para testes, use `onboarding@resend.dev`

## 🔍 Como Verificar se está Correto

### 1. Verifique a API Key no Resend:
- Vá em: https://resend.com/api-keys
- Certifique-se que a key está ativa
- Copie a key completa (começa com `re_...`)

### 2. No Supabase, configure exatamente assim:
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [cole APENAS a API key, sem "apikey:" ou prefixos]
```

### 3. Teste Enviando um Convite:
- Vá na interface
- Envie um convite para um email de teste
- Verifique se chega

## 🔄 Alternativa: Usar SendGrid

Se o Resend continuar dando problema, pode usar SendGrid:

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey  ← Literalmente "apikey"
Password: [SUA_SENDGRID_API_KEY]
Sender email: seu-email@seu-dominio.com
```

## ✅ Checklist

- [ ] API Key do Resend copiada corretamente (começa com `re_...`)
- [ ] Porta configurada como **587** (não 465)
- [ ] Username é **"resend"** (sem aspas)
- [ ] Password é APENAS a API key (sem prefixos)
- [ ] Sender email é `onboarding@resend.dev` (para testes)
- [ ] Salvou as configurações no Supabase
- [ ] Aguardou alguns segundos após salvar

## 📝 Nota Importante

O Supabase usa **SMTP** (Simple Mail Transfer Protocol), não a API REST do Resend. 
Por isso você configura como servidor SMTP, não como API.

A configuração correta é:
- **Host**: smtp.resend.com
- **Port**: 587 (TLS)
- **Username**: resend
- **Password**: sua-api-key (sem prefixos!)

