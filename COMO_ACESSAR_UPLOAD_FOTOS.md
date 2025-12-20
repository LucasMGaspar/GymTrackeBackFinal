# 📍 Como Acessar a Funcionalidade de Upload de Fotos

## 🗺️ Caminho Completo

### Para Personal Trainer (quem faz upload):

1. **Faça Login**
   - Acesse a aplicação
   - Faça login com sua conta de personal trainer

2. **Acesse a Página de Alunos**
   - No menu lateral, clique em **"Alunos"**
   - Ou acesse diretamente: `/app/personal/students`

3. **Escolha um Aluno**
   - Na lista de alunos, encontre o aluno desejado
   - Abaixo do card do aluno, você verá 4 botões:
     - **Templates**
     - **Histórico**
     - **Avaliações** ← **CLIQUE AQUI!**
     - **Relatório**

4. **Acesse as Avaliações Físicas**
   - Clique no botão **"Avaliações"** (terceiro botão, com ícone de gráfico/estatísticas)
   - Você será redirecionado para: `/app/personal/students/{id}/assessments`

5. **Criar Nova Avaliação ou Editar Existente**

   **Para criar nova avaliação com fotos:**
   - Clique no botão **"Nova Avaliação"** (no topo direito)
   - Um modal abrirá com o formulário de avaliação física
   - Role até a seção **"Fotos (opcional)"**
   - Clique na área de upload (borda tracejada)
   - Selecione as imagens que deseja fazer upload
   - As fotos aparecerão como preview
   - Preencha os outros campos da avaliação
   - Clique em **"Criar Avaliação"**

   **Para adicionar fotos em avaliação existente:**
   - Na lista de avaliações, clique no botão de **"Editar"** (ícone de lápis)
   - O mesmo modal abrirá
   - Role até a seção **"Fotos"**
   - Adicione novas fotos ou remova existentes
   - Clique em **"Atualizar"**

### Para Aluno (visualizar fotos):

1. **Faça Login**
   - Acesse a aplicação
   - Faça login com sua conta de aluno

2. **Acesse Suas Avaliações**
   - No menu (pode estar na navegação inferior no mobile), procure por **"Avaliações"**
   - Ou acesse diretamente: `/app/student/assessments`

3. **Visualizar Fotos**
   - As avaliações serão listadas
   - Se uma avaliação tiver fotos, elas aparecerão na seção **"Fotos:"**
   - Clique em qualquer foto para abrir em tamanho maior

## 📋 Estrutura Visual

```
Login como Personal Trainer
    ↓
/app/personal/students (Página de Alunos)
    ↓
Card do Aluno → Botão "Avaliações"
    ↓
/app/personal/students/{id}/assessments (Página de Avaliações)
    ↓
Botão "Nova Avaliação" ou "Editar" em uma avaliação existente
    ↓
Modal de Avaliação Física
    ↓
Seção "Fotos (opcional)" ← AQUI está o upload!
```

## 🎯 Atalho Direto (URL)

Se você já conhece o ID do aluno, pode acessar diretamente:

```
/app/personal/students/{student_id}/assessments
```

Exemplo:
```
/app/personal/students/123e4567-e89b-12d3-a456-426614174000/assessments
```

## 📸 Onde Encontrar o Upload de Fotos

No modal de avaliação, a seção de fotos está localizada:

1. **Após as Circunferências** (Peito, Cintura, Quadril, etc.)
2. **Antes das Observações**

A seção tem:
- Uma área grande com borda tracejada para fazer upload
- Texto: "Clique para fazer upload"
- Informação: "JPEG, PNG ou WebP (máx. 5MB)"
- Preview das fotos enviadas (em grid)
- Botão de remover em cada foto (ao passar o mouse)

## ✅ Requisitos

Antes de usar o upload, certifique-se de que:

1. ✅ O bucket `assessment-photos` foi criado no Supabase Storage
2. ✅ As políticas de Storage foram executadas (arquivo `storage_policies_assessment_photos.sql`)
3. ✅ Você está logado como personal trainer (alunos não podem fazer upload)

## 🐛 Não Encontrou?

Se não conseguir ver a opção de upload:

1. **Verifique se você está logado como personal trainer**
   - Alunos não têm acesso ao upload
   
2. **Verifique se o modal está completo**
   - Role o modal para baixo
   - A seção de fotos está depois das circunferências

3. **Verifique se a funcionalidade foi deployada**
   - Certifique-se de que as últimas alterações foram deployadas

4. **Verifique o console do navegador**
   - Pressione F12
   - Veja se há erros relacionados ao upload

