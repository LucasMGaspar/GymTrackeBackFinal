# 🔍 Verificação de Configuração de Email - Supabase

## ⚠️ Problema: Emails Enviados mas Não Chegam

### ✅ Checklist de Verificação

#### 1. Confirm Email Habilitado (Como na sua tela)
- ✅ **"Confirm email" está ENABLED** → Correto
- ⚠️ **MAS**: Se emails não chegam, usuários não conseguem confirmar e não podem fazer login

**Solução:** Configure SMTP personalizado ou desabilite temporariamente para testes

#### 2. Configurar SMTP Personalizado (RECOMENDADO)

**No Supabase Dashboard:**
1. Vá em **Settings** → **Auth** → **SMTP Settings** (ou **Email Templates** → **SMTP Settings**)
2. Ative **Enable Custom SMTP**
3. Configure com Resend (gratuito):

```
Host: smtp.resend.com
Port: 465 (ou 587)
Username: resend
Password: [sua-api-key-do-resend]
Sender email: onboarding@resend.dev (para testes)
            ou noreply@seu-dominio.com (produção)
Sender name: FitCoach Pro
```

#### 3. Verificar Templates de Email

1. Vá em **Authentication** → **Email Templates**
2. Verifique os templates:
   - **Confirm signup** (para confirmação de email)
   - **Magic Link** (para login)
   - **Invite user** (para convites)
3. Certifique-se que os templates não estão vazios

#### 4. Testar Configuração Atual

**Opção A: Desabilitar "Confirm email" temporariamente**
- No Supabase: **Authentication** → **Providers**
- Desabilite **"Confirm email"**
- Teste se os convites funcionam
- Se funcionar, o problema é o envio de email

**Opção B: Verificar Rate Limits**
- Vá em **Settings** → **Billing**
- Verifique se não excedeu o limite de emails do plano gratuito
- Plano gratuito: limite de 4 emails/hora

#### 5. Verificar Email no Console

No Supabase Dashboard:
1. Vá em **Authentication** → **Users**
2. Procure pelo usuário/aluno
3. Veja se há tentativas de envio de email
4. Verifique logs em **Logs** → **Auth Logs**

## 🚀 Solução Rápida: Resend (Recomendado)

### Passo 1: Criar Conta no Resend
1. Acesse: https://resend.com/signup
2. Crie conta gratuita (3.000 emails/mês)

### Passo 2: Obter API Key
1. No Resend Dashboard: **API Keys** → **Create API Key**
2. Copie a API key (ex: `re_abc123...`)

### Passo 3: Configurar no Supabase
1. **Supabase Dashboard** → **Settings** → **Auth**
2. Role até **SMTP Settings**
3. Ative **Enable Custom SMTP**
4. Preencha:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: [cole sua API key aqui]
   Sender email: onboarding@resend.dev
   Sender name: FitCoach Pro
   ```
5. Clique em **Save**

### Passo 4: Testar
1. Tente enviar um convite novamente
2. Verifique se o email chega
3. Verifique SPAM se não chegar na caixa de entrada

## 🔧 Alternativa: Desabilitar Confirm Email (Desenvolvimento)

Se quiser testar sem emails:

1. No Supabase: **Authentication** → **Providers** → **Email**
2. Desabilite **"Confirm email"**
3. Clique em **Save changes**
4. Agora usuários podem fazer login sem confirmar email

⚠️ **Atenção**: Isso é apenas para desenvolvimento. Em produção, sempre use email confirmação + SMTP personalizado.

## ✅ Verificação Final

Após configurar SMTP:
- [ ] Email chega na caixa de entrada (não spam)
- [ ] Link de confirmação funciona
- [ ] Usuário consegue fazer login após confirmar
- [ ] Templates de email estão personalizados

## 📝 Notas

- **Plano Gratuito Supabase**: Limite de 4 emails/hora
- **Resend Gratuito**: 3.000 emails/mês
- **Emails do Supabase**: Podem ir para spam se não tiver SMTP configurado
- **Domínio verificado**: Melhora deliverability (opcional no início)

