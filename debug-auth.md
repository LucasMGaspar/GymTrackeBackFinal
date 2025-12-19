# 🔍 Debug do Magic Link

## Problema
Magic link chega no email mas redireciona de volta para /login

## ✅ Checklist de Verificação

### 1. Redirect URLs no Supabase
Vá em: https://supabase.com/dashboard/project/euzatoapyzxxurfkjnbq/auth/url-configuration

**Deve estar assim:**

```
Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/auth/callback
http://localhost:3000/**
```

⚠️ **Importante:** Depois de salvar, aguarde 1-2 minutos para propagar.

---

### 2. Verificar o Link do Email

Quando o magic link chegar, **ANTES de clicar**, veja a URL:

Deve ser algo como:
```
https://euzatoapyzxxurfkjnbq.supabase.co/auth/v1/verify
?token=...
&type=magiclink
&redirect_to=http://localhost:3000/auth/callback
```

✅ O `redirect_to` deve apontar para `/auth/callback`

---

### 3. Servidor Rodando?

No terminal onde rodou `npm run dev`, deve estar:
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

⚠️ **NÃO pode ter erros** no terminal!

---

### 4. Teste Manual da Rota de Callback

Abra esta URL no navegador (vai dar erro, mas é esperado):
```
http://localhost:3000/auth/callback
```

**Resultado esperado:**
- Redireciona para `/login?error=auth_failed`

Se der **erro 404**, o arquivo não foi criado corretamente.

---

### 5. Verificar Logs do Console

Ao clicar no magic link:

1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Clique no magic link
4. Veja se há erros em vermelho

**Erros comuns:**
- `Failed to fetch` → Servidor não está rodando
- `Invalid redirect URL` → Redirect URLs mal configuradas
- `Code exchange failed` → Problema no callback

---

### 6. Verificar Email Template (Supabase)

Às vezes o template do email tem URL errada.

Vá em: https://supabase.com/dashboard/project/euzatoapyzxxurfkjnbq/auth/templates

Procure por: **Magic Link**

O template deve conter:
```
{{ .ConfirmationURL }}
```

**NÃO deve ter URL hardcoded!**

---

## 🔧 Solução Rápida

1. **Feche TODAS as abas do localhost**
2. **Limpe cache:** Ctrl+Shift+Del → Limpar tudo
3. **Ou use aba anônima:** Ctrl+Shift+N
4. Acesse: http://localhost:3000
5. Digite email
6. Aguarde 1-2 min
7. Clique no link do email
8. ✅ Deve funcionar!

---

## 🐛 Debug Avançado

Se ainda não funcionar, vamos adicionar logs:

1. Edite o arquivo: `app/auth/callback/route.ts`

2. Adicione logs no início da função:

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // 🔍 DEBUG: Ver o que está chegando
  console.log('🔍 Callback chamado!');
  console.log('Code:', code);
  console.log('Origin:', origin);
  console.log('Search params:', Object.fromEntries(searchParams));
  
  // ... resto do código
}
```

3. Salve, reinicie o servidor
4. Clique no magic link
5. Veja os logs no terminal

**Me envie os logs** se continuar com problema!

---

## ❓ Perguntas para Verificar

1. O servidor está rodando? ✅ / ❌
2. Configurou as Redirect URLs? ✅ / ❌
3. Limpou o cache? ✅ / ❌
4. Está usando aba anônima? ✅ / ❌
5. O link do email tem `redirect_to=...auth/callback`? ✅ / ❌

---

## 🎯 Causa Mais Comum

**90% dos casos:** Redirect URLs não foram salvas corretamente no Supabase.

**Solução:**
1. Vá nas configurações
2. Delete todas as Redirect URLs existentes
3. Adicione novamente: `http://localhost:3000/auth/callback`
4. Adicione: `http://localhost:3000/**`
5. Salve
6. Aguarde 2 minutos
7. Teste novamente

---

## 📞 Ainda com Problema?

Me envie:
1. Screenshot das Redirect URLs configuradas
2. URL completa do magic link (pode ofuscar o token)
3. Logs do console (F12)
4. Logs do terminal (onde rodou npm run dev)
