# 🚀 Solução Rápida: Email Não Chega

## ⚡ Solução Imediata (Para Testes)

### Desabilitar Confirm Email Temporariamente

1. No Supabase Dashboard, vá em **Authentication** → **Providers** → **Email**
2. Desabilite **"Confirm email"**
3. Clique em **"Save changes"**
4. Agora os convites funcionam sem precisar confirmar email

⚠️ **Importante**: Isso é só para testes. Em produção, configure SMTP.

---

## 🔧 Solução Definitiva (Produção)

### Configurar Resend (Gratuito - 3.000 emails/mês)

#### Passo 1: Criar Conta no Resend
1. Acesse: https://resend.com/signup
2. Crie conta gratuita
3. Verifique seu email

#### Passo 2: Obter API Key
1. No Resend Dashboard: **API Keys** → **Create API Key**
2. Dê um nome (ex: "Supabase Auth")
3. Copie a API key (começa com `re_...`)

#### Passo 3: Configurar no Supabase
1. Supabase Dashboard → **Settings** → **Auth**
2. Role até **SMTP Settings**
3. Ative **"Enable Custom SMTP"**
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

#### Passo 4: Testar
1. Envie um convite de teste
2. Verifique sua caixa de entrada
3. Se não chegar, verifique SPAM

---

## ✅ Resultado Esperado

Após configurar SMTP:
- ✅ Emails chegam na caixa de entrada
- ✅ Não vão para spam (Resend tem boa reputação)
- ✅ Links funcionam corretamente
- ✅ Visual profissional

---

## 📝 Notas

- **Plano Gratuito Resend**: 3.000 emails/mês (suficiente para começar)
- **Custo**: $0 (até 3k emails/mês)
- **Deliverability**: Muito melhor que emails do Supabase padrão

