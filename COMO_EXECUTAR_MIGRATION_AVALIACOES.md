# Como Executar a Migration de Avaliações Físicas

## ⚠️ Erro 500 ao Criar Avaliação?

Se você está recebendo o erro **"Failed to create assessment"** ou **erro 500**, é porque a tabela `physical_assessments` ainda não foi criada no banco de dados.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto do GymTrack

### 2. Abra o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** (Nova consulta)

### 3. Execute a Migration

1. Abra o arquivo `supabase/migrations/010_physical_assessments.sql` no seu editor
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl+Enter`)

### 4. Verifique se Funcionou

Após executar, você deve ver uma mensagem de sucesso. Para verificar se a tabela foi criada:

```sql
SELECT * FROM public.physical_assessments LIMIT 1;
```

Se não der erro, a tabela foi criada com sucesso! ✅

## 🔍 O que a Migration Faz?

A migration `010_physical_assessments.sql` cria:

- ✅ Tabela `physical_assessments` com todos os campos necessários
- ✅ Triggers para calcular IMC automaticamente
- ✅ Políticas RLS (Row Level Security) para segurança
- ✅ Índices para melhor performance
- ✅ Função helper para buscar última avaliação

## 📝 Campos da Tabela

A tabela inclui campos para:
- **Medidas básicas**: peso, altura, % gordura, massa muscular, etc.
- **Circunferências**: peito, cintura, quadril, braço, coxa, panturrilha
- **Dobras cutâneas**: tríceps, bíceps, subescapular, ilíaca
- **Observações e fotos**: notas do personal e URLs de fotos

## ⚡ Após Executar a Migration

1. Recarregue a página da aplicação
2. Tente criar uma nova avaliação novamente
3. O erro 500 não deve mais aparecer!

## 🆘 Problemas?

Se ainda houver erros após executar a migration:

1. Verifique se você copiou **TODO** o conteúdo do arquivo
2. Verifique se não há erros no SQL Editor (mensagens em vermelho)
3. Certifique-se de estar no projeto correto do Supabase
4. Verifique os logs do Supabase para mais detalhes

## 📄 Arquivo da Migration

O arquivo está localizado em:
```
supabase/migrations/010_physical_assessments.sql
```

---

**Nota**: Esta migration é necessária apenas uma vez. Após executá-la, todas as funcionalidades de avaliações físicas estarão disponíveis.

