# 🔧 Guia de Configuração do Mercado Pago

Este guia detalha passo a passo como configurar o Mercado Pago no seu projeto.

## 📋 Índice

1. [Criar Conta no Mercado Pago](#1-criar-conta-no-mercado-pago)
2. [Criar Aplicação](#2-criar-aplicação)
3. [Obter Access Token](#3-obter-access-token)
4. [Configurar Variáveis de Ambiente](#4-configurar-variáveis-de-ambiente)
5. [Configurar Webhook](#5-configurar-webhook)
6. [Testar Integração](#6-testar-integração)

---

## 1. Criar Conta no Mercado Pago

1. Acesse [https://www.mercadopago.com.br](https://www.mercadopago.com.br)
2. Clique em **"Criar conta"** ou **"Entrar"** se já tiver conta
3. Complete o cadastro com seus dados
4. Verifique seu email e telefone (necessário para produção)

---

## 2. Criar Aplicação

### Passo 1: Acessar Painel de Desenvolvedores

1. Acesse [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Faça login com sua conta
3. Clique em **"Suas integrações"** ou **"Aplicações"**

### Passo 2: Criar Nova Aplicação

1. Clique em **"Criar aplicação"** ou **"Nova aplicação"**
2. Preencha os dados:
   - **Nome da aplicação**: `GymTracker SaaS` (ou o nome que preferir)
   - **Descrição**: `Sistema de gestão para personal trainers`
   - **Plataforma**: `Web`
   - **URL do site**: `https://seu-dominio.vercel.app` (ou `http://localhost:3000` para desenvolvimento)
3. Clique em **"Criar"**

### Passo 3: Anotar Credenciais

Após criar, você verá duas credenciais:

- **Public Key** (não usada neste projeto, mas pode ser útil)
- **Access Token** ⭐ **IMPORTANTE** - você vai precisar disso

---

## 3. Obter Access Token

### Modo Teste (Sandbox)

Para desenvolvimento e testes:

1. No painel da aplicação, vá para a aba **"Credenciais de teste"**
2. Copie o **Access Token** (começa com `TEST-`)
3. Use este token para testes sem cobranças reais

### Modo Produção

Para produção (cobranças reais):

1. Complete a verificação da conta (documentos, dados bancários)
2. No painel da aplicação, vá para a aba **"Credenciais de produção"**
3. Copie o **Access Token** (começa com `APP_USR-`)
4. ⚠️ **NUNCA** compartilhe este token publicamente

---

## 4. Configurar Variáveis de Ambiente

### Desenvolvimento Local (.env.local)

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```bash
# Mercado Pago
MP_ACCESS_TOKEN=TEST-seu-token-de-teste-aqui

# App URL (para redirects após checkout)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# ou
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Exemplo:**
```bash
MP_ACCESS_TOKEN=TEST-1234567890-abcdef-123456-abcdef123456-123456789
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Produção (Vercel)

1. Acesse seu projeto na [Vercel](https://vercel.com)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as variáveis:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `MP_ACCESS_TOKEN` | `APP_USR-seu-token-de-producao` | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.vercel.app` | Production, Preview, Development |

4. Clique em **Save**
5. Faça um novo deploy para aplicar as variáveis

---

## 5. Configurar Webhook

O webhook permite que o Mercado Pago notifique seu sistema quando houver mudanças na assinatura.

### Para Desenvolvimento Local (usando ngrok)

1. **Instale o ngrok:**
   ```bash
   # Windows (via Chocolatey)
   choco install ngrok
   
   # Ou baixe de https://ngrok.com/download
   ```

2. **Inicie seu servidor Next.js:**
   ```bash
   npm run dev
   ```

3. **Em outro terminal, inicie o ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copie a URL HTTPS** que o ngrok fornece:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Configure o webhook no Mercado Pago:**
   - Acesse [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
   - Selecione sua aplicação
   - Vá em **"Webhooks"** ou **"Notificações"**
   - Clique em **"Adicionar webhook"** ou **"Configurar"**
   - URL do webhook: `https://abc123.ngrok.io/api/webhooks/mercadopago`
   - Eventos: Selecione **"Preapproval"** (ou todos os eventos relacionados)
   - Clique em **"Salvar"**

### Para Produção

1. Acesse [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
2. Selecione sua aplicação
3. Vá em **"Webhooks"** ou **"Notificações"**
4. Adicione a URL:
   ```
   https://seu-dominio.vercel.app/api/webhooks/mercadopago
   ```
5. Selecione os eventos:
   - ✅ **Preapproval** (todos os eventos)
   - Opcional: **Payment** (se usar pagamentos avulsos)
6. Clique em **"Salvar"**

---

## 6. Testar Integração

### Teste 1: Verificar Variáveis de Ambiente

```bash
# No terminal, execute:
node -e "console.log('MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado')"
```

### Teste 2: Testar Criação de Preapproval (via API)

Crie um arquivo de teste `test-mp.js`:

```javascript
const { MercadoPagoConfig, PreApproval } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preapproval = new PreApproval(client);

async function test() {
  try {
    const result = await preapproval.create({
      body: {
        reason: 'Teste de integração',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 99.90,
          currency_id: 'BRL',
        },
        back_url: 'http://localhost:3000/app/personal/billing',
        status: 'pending',
      },
    });
    
    console.log('✅ Sucesso! Preapproval criado:', result.id);
    console.log('Checkout URL:', result.init_point || result.sandbox_init_point);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
```

Execute:
```bash
node test-mp.js
```

### Teste 3: Testar Checkout no Frontend

1. Inicie o servidor:
   ```bash
   npm run dev
   ```

2. Acesse: `http://localhost:3000/app/personal/plans`
3. Clique em **"Assinar"** em um plano
4. Você deve ser redirecionado para o checkout do Mercado Pago

### Teste 4: Testar Webhook (Desenvolvimento)

1. Use o **ngrok** para expor seu servidor local
2. Configure o webhook no MP apontando para o ngrok
3. Crie uma assinatura de teste
4. Verifique os logs do servidor para ver se o webhook foi recebido
5. Verifique no Supabase se o evento foi armazenado em `subscription_events`
6. Verifique se a `subscription` foi atualizada

---

## 🔍 Verificações Importantes

### ✅ Checklist de Configuração

- [ ] Conta no Mercado Pago criada e verificada
- [ ] Aplicação criada no painel de desenvolvedores
- [ ] Access Token copiado (teste ou produção)
- [ ] Variável `MP_ACCESS_TOKEN` configurada no `.env.local` e Vercel
- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada
- [ ] Webhook configurado no Mercado Pago
- [ ] Migrações SQL executadas no Supabase
- [ ] Seed de planos executado no Supabase

### 🔒 Segurança

- ✅ **NUNCA** commite o `.env.local` no Git
- ✅ Use token de **TESTE** para desenvolvimento
- ✅ Use token de **PRODUÇÃO** apenas em produção
- ✅ Mantenha o Access Token secreto
- ✅ Revogue tokens comprometidos imediatamente

---

## 🐛 Troubleshooting

### Erro: "MP_ACCESS_TOKEN environment variable is not set"

**Solução:**
- Verifique se a variável está no `.env.local` (desenvolvimento)
- Verifique se está configurada na Vercel (produção)
- Reinicie o servidor após adicionar variáveis

### Erro: "Invalid access token"

**Solução:**
- Verifique se copiou o token completo (sem espaços)
- Verifique se está usando o token correto (teste vs produção)
- Gere um novo token no painel do MP se necessário

### Webhook não está sendo recebido

**Solução:**
- Verifique se a URL do webhook está correta
- Use ngrok para desenvolvimento local
- Verifique logs do servidor
- Verifique tabela `subscription_events` no Supabase
- Teste manualmente enviando um POST para `/api/webhooks/mercadopago`

### Checkout não redireciona

**Solução:**
- Verifique se `NEXT_PUBLIC_APP_URL` está configurado
- Verifique logs do servidor para erros
- Verifique se o token do MP está válido
- Teste criando preapproval manualmente via API

---

## 📚 Recursos Adicionais

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [API de Preapproval](https://www.mercadopago.com.br/developers/pt/reference/preapproval/_preapproval/post)
- [Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)

---

## 💡 Dicas

1. **Sempre teste primeiro no modo Sandbox** antes de usar produção
2. **Use ngrok para desenvolvimento local** - facilita muito o teste de webhooks
3. **Monitore os logs** - o sistema loga todos os eventos importantes
4. **Verifique a tabela `subscription_events`** - todos os webhooks são armazenados lá
5. **Mantenha backups** - especialmente dos Access Tokens em local seguro

---

## ✅ Pronto!

Após seguir todos os passos, seu sistema de billing estará configurado e pronto para uso!

Para mais detalhes sobre como usar o sistema, consulte o [README_BILLING.md](./README_BILLING.md).

