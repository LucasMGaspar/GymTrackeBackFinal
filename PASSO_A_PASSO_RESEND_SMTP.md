# 📝 Passo a Passo: Configurar Resend SMTP no Supabase

## ⚠️ Erro que Você Está Vendo
```json
{
  "message": "No API key found in request",
  "hint": "No `apikey` request header or url param was found."
}
```

## ✅ Solução Passo a Passo

### PASSO 1: Criar/Obter API Key do Resend

1. **Acesse:** https://resend.com/login (ou signup se não tiver conta)

2. **Vá em:** **API Keys** (menu lateral esquerdo)

3. **Crie uma nova API Key:**
   - Clique em **"Create API Key"**
   - Nome: `Supabase SMTP` (ou qualquer nome)
   - Permissão: **Sending access** (pode deixar todas marcadas)
   - Clique em **"Create"**

4. **Copie a API Key:**
   - Vai aparecer algo como: `re_abc123XYZ789...`
   - **COPIE A KEY COMPLETA** (começa com `re_`)
   - ⚠️ Só aparece uma vez! Salve em lugar seguro.

### PASSO 2: Configurar no Supabase

1. **Acesse:** https://supabase.com/dashboard

2. **Selecione seu projeto**

3. **Vá em:** Settings → **Auth** (menu lateral)

4. **Role até:** **SMTP Settings** (procure na página)

5. **Preencha EXATAMENTE assim:**

   ```
   [✓] Enable custom SMTP  ← Ative esta opção
   
   Sender Details:
   ├─ Sender email address: onboarding@resend.dev
   ├─ Sender name: FitCoach Pro
   
   SMTP Provider Settings:
   ├─ Host: smtp.resend.com
   ├─ Port number: 587  ← ⚠️ IMPORTANTE: Use 587!
   ├─ Minimum interval per user: 60 (pode deixar)
   ├─ Username: resend  ← Exatamente "resend" (sem aspas)
   └─ Password: [cole sua API key aqui]  ← A que você copiou (re_...)
   ```

### PASSO 3: Verificar Antes de Salvar

✅ **Checklist:**
- [ ] Host: `smtp.resend.com` (sem http://, sem espaços)
- [ ] Port: `587` (não 465!)
- [ ] Username: `resend` (letras minúsculas, sem aspas)
- [ ] Password: API key completa que começa com `re_...` (sem espaços, sem prefixos)
- [ ] Sender email: `onboarding@resend.dev` (para testes)

### PASSO 4: Salvar e Testar

1. Clique em **"Save changes"** (botão verde)
2. **Aguarde 5-10 segundos** (pode levar um pouco)
3. Você verá uma mensagem de sucesso
4. **Teste enviando um convite**

## 🔍 Se Ainda Der Erro

### Verificar 1: API Key Está Correta?

- Volte no Resend: **API Keys**
- Confirme que a key está **ativa** (não deletada)
- Se necessário, crie uma nova e copie novamente

### Verificar 2: Porta Está Correta?

- Deve ser **587** (não 465!)
- Resend SMTP usa porta 587 com TLS

### Verificar 3: Username Está Correto?

- Deve ser exatamente **"resend"** (minúsculas)
- Não pode ter espaços antes/depois
- Não precisa de aspas

### Verificar 4: Password Está Correta?

- Deve ser a API key completa (começa com `re_...`)
- Não coloque "apikey:" na frente
- Não coloque espaços
- Copie e cole diretamente

## 🧪 Teste Rápido

1. Salve as configurações
2. Aguarde 10 segundos
3. No Supabase, vá em **Authentication** → **Users**
4. Tente enviar um convite de teste
5. Se ainda der erro, verifique os logs em **Logs** → **Auth Logs**

## 📸 Configuração Visual Correta

```
┌─────────────────────────────────────────────┐
│ ☑ Enable custom SMTP                       │
├─────────────────────────────────────────────┤
│                                             │
│ Sender email address:                       │
│ ┌─────────────────────────────────────┐    │
│ │ onboarding@resend.dev              │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Sender name:                                │
│ ┌─────────────────────────────────────┐    │
│ │ FitCoach Pro                       │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Host:                                       │
│ ┌─────────────────────────────────────┐    │
│ │ smtp.resend.com                    │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Port number:                                │
│ ┌─────────────────────────────────────┐    │
│ │ 587  ← USE 587!                    │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Username:                                   │
│ ┌─────────────────────────────────────┐    │
│ │ resend                              │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Password:                                   │
│ ┌─────────────────────────────────────┐    │
│ │ re_abc123XYZ789...                  │    │
│ │ (cole a API key completa aqui)      │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ [Cancel]  [Save changes]                   │
└─────────────────────────────────────────────┘
```

## ✅ Após Configurar Corretamente

Você deve conseguir:
- ✅ Enviar emails normalmente
- ✅ Não ver mais o erro "No API key found"
- ✅ Receber emails na caixa de entrada (ou spam, se for primeira vez)

## 🆘 Se Nada Funcionar

Como alternativa temporária:
1. **Desabilite "Confirm email"** em Authentication → Providers
2. Use **links diretos** para enviar manualmente
3. Configure SMTP depois quando tiver mais tempo

