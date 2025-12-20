-- =====================================================
-- PHYSICAL ASSESSMENTS SYSTEM
-- Migration: 010_physical_assessments.sql
-- =====================================================

-- 1. Physical Assessments table
CREATE TABLE IF NOT EXISTS public.physical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Data da avaliação
  assessment_date DATE NOT NULL,
  
  -- Medidas corporais básicas
  weight NUMERIC(5, 2),                    -- Peso (kg)
  height NUMERIC(5, 2),                    -- Altura (cm)
  body_fat_percentage NUMERIC(5, 2),       -- % Gordura corporal
  muscle_mass NUMERIC(5, 2),               -- Massa muscular (kg)
  body_water_percentage NUMERIC(5, 2),     -- % Água corporal
  bone_mass NUMERIC(5, 2),                 -- Massa óssea (kg)
  bmi NUMERIC(5, 2),                       -- IMC (calculado automaticamente)
  
  -- Circunferências (cm)
  chest_circumference NUMERIC(5, 2),       -- Peito
  waist_circumference NUMERIC(5, 2),       -- Cintura
  hip_circumference NUMERIC(5, 2),         -- Quadril
  arm_circumference NUMERIC(5, 2),         -- Braço
  thigh_circumference NUMERIC(5, 2),       -- Coxa
  calf_circumference NUMERIC(5, 2),        -- Panturrilha
  
  -- Dobras cutâneas (mm) - opcional
  triceps_skinfold NUMERIC(5, 2),
  biceps_skinfold NUMERIC(5, 2),
  subscapular_skinfold NUMERIC(5, 2),
  iliac_skinfold NUMERIC(5, 2),
  
  -- Observações
  notes TEXT,                              -- Observações do personal
  photos JSONB DEFAULT '[]'::jsonb,        -- URLs de fotos (array de strings)
  
  -- Metadados
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.physical_assessments IS 'Avaliações físicas dos alunos registradas pelos personal trainers';
COMMENT ON COLUMN public.physical_assessments.bmi IS 'IMC calculado automaticamente: peso (kg) / altura (m)²';
COMMENT ON COLUMN public.physical_assessments.photos IS 'Array de URLs de fotos: ["url1", "url2"]';

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_assessments_student_id ON public.physical_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_personal_id ON public.physical_assessments(personal_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON public.physical_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessments_student_date ON public.physical_assessments(student_id, assessment_date DESC);

-- 3. Trigger para calcular IMC automaticamente
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  -- IMC = peso (kg) / altura (m)²
  IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL AND NEW.height > 0 THEN
    NEW.bmi := ROUND((NEW.weight / POWER(NEW.height / 100, 2))::numeric, 2);
  ELSE
    NEW.bmi := NULL;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_bmi
  BEFORE INSERT OR UPDATE ON public.physical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bmi();

-- 4. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.physical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessments_updated_at();

-- 5. RLS Policies
ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;

-- Personal trainers can view assessments of their students
CREATE POLICY "Personal trainers can view their students' assessments"
  ON public.physical_assessments FOR SELECT
  USING (personal_id = auth.uid());

-- Personal trainers can create assessments for their students
CREATE POLICY "Personal trainers can create assessments for their students"
  ON public.physical_assessments FOR INSERT
  WITH CHECK (
    personal_id = auth.uid() 
    AND student_id IN (
      SELECT id FROM public.students WHERE personal_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Personal trainers can update assessments of their students
CREATE POLICY "Personal trainers can update their students' assessments"
  ON public.physical_assessments FOR UPDATE
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

-- Personal trainers can delete assessments of their students
CREATE POLICY "Personal trainers can delete their students' assessments"
  ON public.physical_assessments FOR DELETE
  USING (personal_id = auth.uid());

-- Students can view their own assessments
CREATE POLICY "Students can view their own assessments"
  ON public.physical_assessments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE student_user_id = auth.uid()
    )
  );

-- 6. Function to get latest assessment for a student
CREATE OR REPLACE FUNCTION get_latest_assessment(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  assessment_date DATE,
  weight NUMERIC(5, 2),
  body_fat_percentage NUMERIC(5, 2),
  bmi NUMERIC(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.assessment_date,
    pa.weight,
    pa.body_fat_percentage,
    pa.bmi
  FROM public.physical_assessments pa
  WHERE pa.student_id = p_student_id
  ORDER BY pa.assessment_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_latest_assessment IS 'Returns the latest assessment for a student';

