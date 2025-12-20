# 🚨 ERRADO: Bucket not found - Solução Rápida

## ⚠️ Você está vendo este erro porque o bucket ainda não foi criado!

### 🔧 SOLUÇÃO EM 3 PASSOS:

---

## PASSO 1: Criar o Bucket

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione seu projeto** (GymTrack)
3. **No menu lateral esquerdo**, clique em **"Storage"**
4. **Clique no botão "New bucket"** (geralmente no topo direito)

5. **No formulário que abrir:**
   ```
   Name: assessment-photos
   Public bucket: [ ] DESMARCADO (deixe vazio)
   File size limit: 5 (ou 5242880)
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```

6. **Clique em "Create bucket"**

✅ **Verifique:** O bucket `assessment-photos` deve aparecer na lista!

---

## PASSO 2: Executar as Políticas

1. **Ainda no Supabase Dashboard**, clique em **"SQL Editor"** (no menu lateral)
2. **Abra o arquivo** `supabase/storage_policies_assessment_photos.sql` no seu editor
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor** do Supabase
5. **Clique em "Run"** (ou pressione `Ctrl+Enter`)

✅ **Resultado esperado:** Mensagem de sucesso e 3 políticas criadas

---

## PASSO 3: Testar Novamente

1. **Volte para a aplicação**
2. **Tente fazer upload de uma foto novamente**
3. **O erro deve desaparecer!**

---

## 🔍 Como Verificar se Funcionou

Execute esta query no SQL Editor:

```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%assessment%';
```

Você deve ver **3 políticas** listadas.

---

## ❓ Ainda com Erro?

### Erro continua: "Bucket not found"
- Verifique se o nome está EXATAMENTE: `assessment-photos` (sem espaços, case-sensitive)
- Veja se o bucket aparece na lista de buckets no Storage

### Erro: "Permission denied" ou "RLS policy"
- Execute novamente o SQL das políticas (Passo 2)
- Verifique se há mensagens de erro no SQL Editor

### Outro erro?
- Verifique o console do navegador (F12) para mais detalhes
- Verifique os logs do Supabase

---

**Depois de seguir esses 3 passos, o upload de fotos deve funcionar! ✅**

