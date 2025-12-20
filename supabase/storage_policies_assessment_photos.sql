-- =====================================================
-- STORAGE POLICIES FOR ASSESSMENT PHOTOS
-- Execute este script no SQL Editor do Supabase
-- APÓS criar o bucket 'assessment-photos' no Storage
-- =====================================================

-- IMPORTANTE: Antes de executar este script:
-- 1. Vá para Storage → Create a new bucket
-- 2. Nome: assessment-photos
-- 3. Public: false (privado)
-- 4. File size limit: 5 MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp

-- =====================================================
-- POLÍTICAS DE UPLOAD (INSERT)
-- =====================================================

-- Personal trainers podem fazer upload de fotos
-- Os arquivos são organizados por personal_id: {personal_id}/{filename}
CREATE POLICY "Personal trainers can upload assessment photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assessment-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- POLÍTICAS DE LEITURA (SELECT)
-- =====================================================

-- Personal trainers podem ver fotos dos seus alunos
-- Alunos podem ver suas próprias fotos
CREATE POLICY "Users can view assessment photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assessment-photos'
  AND (
    -- Personal pode ver fotos dos seus alunos (arquivos na pasta do seu ID)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Aluno pode ver suas próprias fotos (através das avaliações vinculadas ao seu personal)
    (storage.foldername(name))[1] IN (
      SELECT personal_id::text FROM public.students 
      WHERE student_user_id = auth.uid()
    )
  )
);

-- =====================================================
-- POLÍTICAS DE DELETE
-- =====================================================

-- Personal trainers podem deletar fotos que fizeram upload
CREATE POLICY "Personal trainers can delete assessment photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assessment-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Execute esta query para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%assessment%';

