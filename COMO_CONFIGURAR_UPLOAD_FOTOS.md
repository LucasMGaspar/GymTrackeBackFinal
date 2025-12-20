# 📸 Como Configurar Upload de Fotos nas Avaliações

## ⚠️ Passo a Passo OBRIGATÓRIO

Para que o upload de fotos funcione, você precisa configurar o bucket no Supabase Storage.

### 1. Criar o Bucket no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá para **Storage** no menu lateral
3. Clique em **"New bucket"** ou **"Create a new bucket"**
4. Configure assim:
   - **Nome do bucket:** `assessment-photos` (EXATO, case-sensitive)
   - **Public bucket:** ❌ **Desmarcado** (privado)
   - **File size limit:** `5 MB` (ou deixe padrão)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp` (opcional, mas recomendado)

5. Clique em **"Create bucket"**

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

