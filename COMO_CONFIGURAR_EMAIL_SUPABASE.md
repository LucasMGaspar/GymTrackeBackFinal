# 📧 Como Configurar Email no Supabase

## Problema
Os emails estão sendo enviados (status 200) mas não chegam na caixa de entrada.

## ✅ Soluções

### 1. Verificar Pasta de Spam
- Primeiro, sempre verifique a pasta de **SPAM/LIXO ELETRÔNICO**
- Os emails do Supabase podem ser marcados como spam

### 2. Configurar SMTP Personalizado (Recomendado)

O Supabase permite usar um serviço de email profissional como **Resend** ou **SendGrid**.

#### Opção A: Usar Resend (Gratuito até 3.000 emails/mês)

1. **Criar conta no Resend:**
   - Acesse: https://resend.com
   - Crie uma conta gratuita
   - Verifique seu domínio (ou use domínio de teste)

2. **Obter API Key:**
   - Vá em **API Keys**
   - Crie uma nova API Key
   - Copie a chave

3. **Configurar no Supabase:**
   - Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/settings/auth
   - Role até **SMTP Settings**
   - Ative **Enable Custom SMTP**
   - Configure:
   ```
   Host: smtp.resend.com
   Port: 587  ⚠️ USE 587, não 465!
   Username: resend
   Password: [SUA_API_KEY_DO_RESEND]  ← Cole APENAS a API key (começa com re_...)
   Sender email: onboarding@resend.dev (para testes)
                 ou noreply@seu-dominio.com (produção, precisa verificar domínio)
   Sender name: FitCoach Pro
   ```
   
   **⚠️ IMPORTANTE:**
   - Porta deve ser **587** (não 465)
   - Password é APENAS a API key (não coloque "apikey:" ou prefixos)
   - Para testes, use `onboarding@resend.dev`

4. **Testar:**
   - Envie um convite de teste
   - Verifique se o email chega

#### Opção B: Usar SendGrid

1. Criar conta no SendGrid
2. Criar API Key
3. Configurar no Supabase:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [SUA_API_KEY]
   Sender email: seu-email@seu-dominio.com
   ```

### 3. Verificar Templates de Email no Supabase

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/auth/templates
2. Verifique os templates:
   - **Invite User** (para convites)
   - **Magic Link** (para login)
3. Certifique-se que os templates estão ativos e não estão vazios

### 4. Verificar Rate Limits

- O plano gratuito do Supabase tem limite de emails
- Verifique se não excedeu o limite: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/settings/billing

### 5. Usar Links Diretos (Alternativa Temporária)

Se os emails não chegarem, você pode:

1. **Copiar o link gerado** na interface
2. **Enviar manualmente** via WhatsApp, SMS ou outro canal
3. O link direto funciona mesmo sem email

## 🚀 Configuração Rápida com Resend (Recomendado)

```bash
# 1. Criar conta no Resend (gratuito)
# https://resend.com/signup

# 2. No Supabase Dashboard:
# Settings > Auth > SMTP Settings
# Enable Custom SMTP
# 
# Host: smtp.resend.com
# Port: 465
# Username: resend  
# Password: [sua-api-key]
# Sender: onboarding@resend.dev (para testes)
#         ou noreply@seu-dominio.com (produção)
```

## 📝 Notas Importantes

- **Em desenvolvimento:** O Supabase pode não enviar emails automaticamente
- **Em produção:** Configure SMTP personalizado para maior confiabilidade
- **Domínio verificado:** Para produção, verifique seu domínio no Resend/SendGrid
- **Limites:** Resend gratuito = 3.000 emails/mês, SendGrid = 100 emails/dia

## ✅ Verificação Final

Após configurar, teste enviando um convite e verifique:
- ✅ Email chega na caixa de entrada (não spam)
- ✅ Link funciona corretamente
- ✅ Visual do email está adequado

