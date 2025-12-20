# 👨‍💼 Como Criar Conta de Personal Trainer

## 📋 Formas de Criar Conta de Personal Trainer

### ✅ Forma Atual (Automática)

**Quando você clica em "Assinar" em um plano:**

1. Acesse a página de planos: `/plans` (pública, sem login)
2. Clique em **"Assinar Agora"** em qualquer plano (Pro ou Business)
3. Você será redirecionado para `/login?plan_slug=pro-monthly` (ou outro plano)
4. Faça login com seu email
5. O sistema **automaticamente** cria sua conta como **Personal Trainer**
6. Você é redirecionado para o checkout do Mercado Pago
7. Após pagamento, sua conta estará ativa como Personal Trainer

**Resumo:** Se você escolher um plano antes de fazer login, você vira Personal Trainer automaticamente.

---

### 🔧 Forma Manual (SQL - Para casos especiais)

Se você já tem uma conta e quer mudar de Student para Personal Trainer:

1. Acesse o Supabase SQL Editor
2. Execute este script (substitua o email pelo seu):

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email
DO $$
DECLARE
  user_email TEXT := 'seu-email@exemplo.com';
  user_name TEXT := 'Seu Nome';
  found_user_id UUID;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email;

  IF found_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado! Email: %', user_email;
  END IF;

  -- Criar ou atualizar profile como personal
  INSERT INTO public.profiles (id, role, name)
  VALUES (found_user_id, 'personal', user_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'personal',
    name = user_name;

  RAISE NOTICE '✅ Profile atualizado para Personal Trainer!';
  RAISE NOTICE 'ID: %', found_user_id;
  RAISE NOTICE 'Email: %', user_email;
END $$;
```

---

## 🎯 Fluxo Recomendado para Novos Usuários

### Para Personal Trainers:

1. **Acesse a landing page:** `/` (página inicial)
2. **Clique em "Ver Planos"** ou acesse `/plans`
3. **Escolha um plano** (Pro Mensal, Pro Anual, Business Mensal ou Business Anual)
4. **Clique em "Assinar Agora"**
5. **Faça login** com seu email
6. **Complete o checkout** no Mercado Pago
7. **Pronto!** Você é um Personal Trainer

### Para Alunos (Students):

1. **Aguarde convite** do seu Personal Trainer
2. **Receba o email** de convite
3. **Clique no link** e faça login
4. **Sua conta será criada** automaticamente como Student
5. **Acesso liberado** aos treinos

---

## ⚠️ Importante

- **Não há como escolher manualmente** o tipo de conta na tela de login
- Se você fizer login **sem escolher um plano**, você será criado como **Student** por padrão
- Para ser Personal Trainer, você **deve escolher um plano primeiro**
- Uma vez criado como Student, você precisa usar SQL para mudar (ou criar nova conta)

---

## 🔄 Mudando de Student para Personal Trainer

Se você já tem uma conta como Student e quer virar Personal Trainer:

### Opção 1: Via SQL (Rápido)
Use o script SQL acima no Supabase.

### Opção 2: Criar Nova Conta
1. Use um email diferente
2. Acesse `/plans`
3. Escolha um plano e assine
4. Isso criará uma nova conta como Personal Trainer

---

## 💡 Sugestão de Melhoria Futura

Seria interessante adicionar:
- Um botão "Sou Personal Trainer" na landing page
- Uma opção na tela de login para escolher o tipo de conta
- Uma página de onboarding que pergunta "Você é Personal Trainer ou Aluno?"

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas ou precisar de suporte, entre em contato através do sistema.


