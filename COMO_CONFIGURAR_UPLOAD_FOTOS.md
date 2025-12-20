# 📸 Como Configurar Upload de Fotos nas Avaliações

## ⚠️ Passo a Passo OBRIGATÓRIO

Para que o upload de fotos funcione, você precisa configurar o bucket no Supabase Storage.

### 1. Criar o Bucket no Supabase

#### Passo a Passo Detalhado:

1. **Acesse o Supabase Dashboard**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione o projeto do GymTrack

2. **Abra a seção Storage**
   - No menu lateral esquerdo, procure por **"Storage"** (ícone de pasta/arquivo)
   - Clique em **"Storage"**

3. **Criar novo bucket**
   - Você verá a lista de buckets existentes (se houver)
   - Procure pelo botão **"New bucket"** ou **"Create a new bucket"** (geralmente no topo direito ou no centro se estiver vazio)
   - Clique nele

4. **Configurar o bucket**
   Preencha o formulário com as seguintes informações:
   
   - **Name:** Digite exatamente `assessment-photos` (importante: case-sensitive)
   
   - **Public bucket:** ❌ **NÃO marque** (deixe desmarcado)
     - Isso torna o bucket privado, garantindo segurança
   
   - **File size limit:** 
     - Se houver esse campo, digite `5242880` (5MB em bytes) ou `5`
     - Ou selecione a opção "5 MB" se houver dropdown
     - Se não houver esse campo, pode deixar padrão (o limite será validado no código)
   
   - **Allowed MIME types:** (Opcional, mas recomendado)
     - Se houver esse campo, digite: `image/jpeg, image/png, image/webp`
     - Ou deixe vazio se não houver

5. **Criar o bucket**
   - Clique no botão **"Create bucket"** ou **"Save"**
   - Aguarde a confirmação de criação

6. **Verificar se foi criado**
   - O bucket `assessment-photos` deve aparecer na lista de buckets
   - Você deve conseguir vê-lo na lista

### 2. Executar as Políticas de Storage

1. No Supabase Dashboard, vá para **SQL Editor**
2. Abra o arquivo `supabase/storage_policies_assessment_photos.sql`
3. **Copie TODO o conteúdo** do arquivo
4. Cole no SQL Editor
5. Clique em **"Run"** (ou `Ctrl+Enter`)

### 3. Verificar se Funcionou

Execute esta query no SQL Editor para verificar:

```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%assessment%';
```

Você deve ver 3 políticas:
- `Personal trainers can upload assessment photos`
- `Users can view assessment photos`
- `Personal trainers can delete assessment photos`

## ✅ Pronto!

Após essas configurações, o upload de fotos funcionará normalmente!

## 🔍 Como Funciona

1. **Upload:** Personal trainer faz upload de fotos através do modal de avaliação
2. **Armazenamento:** Fotos são salvas em `assessment-photos/{personal_id}/{filename}`
3. **Acesso:** 
   - Personal pode ver/upload/deletar suas próprias fotos
   - Aluno pode ver fotos das suas avaliações
4. **URLs:** Fotos são armazenadas como URLs públicas no campo `photos` (JSONB array)

## 📋 Estrutura de Pastas no Storage

```
assessment-photos/
  ├── {personal_id_1}/
  │   ├── 1234567890-abc123.jpg
  │   └── 1234567891-def456.png
  ├── {personal_id_2}/
  │   └── 1234567892-ghi789.webp
  └── ...
```

## 🛡️ Segurança

- ✅ Bucket é privado (não público)
- ✅ Políticas RLS garantem que apenas:
  - Personal pode fazer upload/deletar suas próprias fotos
  - Personal pode ver fotos dos seus alunos
  - Aluno pode ver fotos das suas avaliações
- ✅ Validação de tipo de arquivo (apenas imagens)
- ✅ Limite de tamanho (5MB)

## 🐛 Problemas Comuns

### Erro: "Bucket not found"
- **Causa:** Bucket `assessment-photos` não foi criado
- **Solução:** Crie o bucket seguindo o passo 1

### Erro: "new row violates row-level security policy"
- **Causa:** Políticas de Storage não foram executadas
- **Solução:** Execute o SQL do passo 2

### Fotos não aparecem
- **Causa:** URLs podem estar incorretas ou bucket está privado sem políticas
- **Solução:** Verifique se as políticas foram criadas (passo 3)

## 📝 Notas

- As fotos são armazenadas com URLs públicas do Supabase Storage
- O campo `photos` na tabela `physical_assessments` é um array JSONB: `["url1", "url2"]`
- Máximo recomendado: 5-10 fotos por avaliação (para performance)

