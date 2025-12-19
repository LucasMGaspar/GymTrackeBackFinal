-- =====================================================
-- SEED DATA - Exemplo para Testes
-- =====================================================
-- IMPORTANTE: Execute este arquivo APENAS após:
-- 1. Criar usuários via Magic Link no Supabase Auth
-- 2. Pegar os IDs reais dos usuários criados
-- 3. Substituir os placeholders abaixo

-- =====================================================
-- PASSO 1: Criar um Personal Trainer
-- =====================================================
-- Primeiro, faça login com magic link usando um email (ex: personal@test.com)
-- Depois, execute esta query para pegar o ID:
-- SELECT id, email FROM auth.users WHERE email = 'personal@test.com';

-- Copie o ID e cole abaixo:
DO $$
DECLARE
    personal_user_id UUID := 'COLE-O-ID-DO-PERSONAL-AQUI'; -- Ex: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
BEGIN
    -- Criar profile como personal
    INSERT INTO public.profiles (id, role, name)
    VALUES (personal_user_id, 'personal', 'João Personal Trainer')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Personal trainer criado com ID: %', personal_user_id;
END $$;

-- =====================================================
-- PASSO 2: Criar Exercícios (Biblioteca do Personal)
-- =====================================================
DO $$
DECLARE
    personal_user_id UUID := 'COLE-O-ID-DO-PERSONAL-AQUI';
    ex_supino UUID;
    ex_leg_press UUID;
    ex_rosca UUID;
    ex_agachamento UUID;
    ex_puxada UUID;
BEGIN
    -- Exercícios de Peito
    INSERT INTO public.exercises (personal_id, name, muscle_group, notes)
    VALUES 
        (personal_user_id, 'Supino Reto', 'Peito', 'Barra ou halteres')
    RETURNING id INTO ex_supino;
    
    -- Exercícios de Pernas
    INSERT INTO public.exercises (personal_id, name, muscle_group, notes)
    VALUES 
        (personal_user_id, 'Leg Press 45°', 'Pernas', 'Amplitude completa')
    RETURNING id INTO ex_leg_press;
    
    INSERT INTO public.exercises (personal_id, name, muscle_group, notes)
    VALUES 
        (personal_user_id, 'Agachamento Livre', 'Pernas', 'Barra nas costas')
    RETURNING id INTO ex_agachamento;
    
    -- Exercícios de Bíceps
    INSERT INTO public.exercises (personal_id, name, muscle_group, notes)
    VALUES 
        (personal_user_id, 'Rosca Direta com Barra', 'Bíceps', 'Barra W ou reta')
    RETURNING id INTO ex_rosca;
    
    -- Exercícios de Costas
    INSERT INTO public.exercises (personal_id, name, muscle_group, notes)
    VALUES 
        (personal_user_id, 'Puxada Frontal', 'Costas', 'Pegada pronada')
    RETURNING id INTO ex_puxada;
    
    RAISE NOTICE 'Exercícios criados!';
END $$;

-- =====================================================
-- PASSO 3: Criar um Aluno
-- =====================================================
-- Faça login com magic link usando outro email (ex: aluno@test.com)
-- Pegue o ID do usuário aluno:
-- SELECT id, email FROM auth.users WHERE email = 'aluno@test.com';

DO $$
DECLARE
    personal_user_id UUID := 'COLE-O-ID-DO-PERSONAL-AQUI';
    student_user_id UUID := 'COLE-O-ID-DO-ALUNO-AQUI'; -- Ex: 'b1ffcd88-8d1c-5fg9-cc7e-7cc0ce491b22'
    student_record_id UUID;
BEGIN
    -- Criar registro de aluno
    INSERT INTO public.students (personal_id, student_user_id, student_name, student_email, status)
    VALUES (personal_user_id, student_user_id, 'Maria Aluna', 'aluno@test.com', 'active')
    RETURNING id INTO student_record_id;
    
    -- Criar profile do aluno (caso não exista)
    INSERT INTO public.profiles (id, role, name)
    VALUES (student_user_id, 'student', 'Maria Aluna')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Aluno criado com ID: %', student_record_id;
END $$;

-- =====================================================
-- PASSO 4: Criar Templates de Treino
-- =====================================================
DO $$
DECLARE
    personal_user_id UUID := 'COLE-O-ID-DO-PERSONAL-AQUI';
    student_user_id UUID := 'COLE-O-ID-DO-ALUNO-AQUI';
    student_record_id UUID;
    template_segunda UUID;
    template_quarta UUID;
    template_sexta UUID;
    
    ex_supino UUID;
    ex_rosca UUID;
    ex_leg_press UUID;
    ex_agachamento UUID;
    ex_puxada UUID;
BEGIN
    -- Pegar ID do student record
    SELECT id INTO student_record_id
    FROM public.students
    WHERE student_user_id = student_user_id
    LIMIT 1;
    
    -- Pegar IDs dos exercícios
    SELECT id INTO ex_supino FROM public.exercises WHERE personal_id = personal_user_id AND name = 'Supino Reto';
    SELECT id INTO ex_rosca FROM public.exercises WHERE personal_id = personal_user_id AND name = 'Rosca Direta com Barra';
    SELECT id INTO ex_leg_press FROM public.exercises WHERE personal_id = personal_user_id AND name = 'Leg Press 45°';
    SELECT id INTO ex_agachamento FROM public.exercises WHERE personal_id = personal_user_id AND name = 'Agachamento Livre';
    SELECT id INTO ex_puxada FROM public.exercises WHERE personal_id = personal_user_id AND name = 'Puxada Frontal';
    
    -- Template para SEGUNDA (weekday = 1) - Treino A: Peito + Bíceps
    INSERT INTO public.workout_templates (student_id, weekday, name, notes)
    VALUES (student_record_id, 1, 'Treino A - Peito/Bíceps', 'Foco em hipertrofia')
    RETURNING id INTO template_segunda;
    
    INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, notes)
    VALUES 
        (template_segunda, ex_supino, 1, 4, '12/10/8/8', 'Aumentar carga nas últimas séries'),
        (template_segunda, ex_rosca, 2, 3, '12', 'Movimento controlado');
    
    -- Template para QUARTA (weekday = 3) - Treino B: Pernas
    INSERT INTO public.workout_templates (student_id, weekday, name, notes)
    VALUES (student_record_id, 3, 'Treino B - Pernas', 'Treino intenso')
    RETURNING id INTO template_quarta;
    
    INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, notes)
    VALUES 
        (template_quarta, ex_agachamento, 1, 4, '10', 'Profundidade completa'),
        (template_quarta, ex_leg_press, 2, 3, '15', 'Amplitude máxima');
    
    -- Template para SEXTA (weekday = 5) - Treino C: Costas
    INSERT INTO public.workout_templates (student_id, weekday, name, notes)
    VALUES (student_record_id, 5, 'Treino C - Costas', 'Trabalhar dorsais')
    RETURNING id INTO template_sexta;
    
    INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, notes)
    VALUES 
        (template_sexta, ex_puxada, 1, 4, '12/12/10/10', 'Contrair escapulas');
    
    RAISE NOTICE 'Templates criados para Segunda, Quarta e Sexta!';
END $$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Execute estas queries para verificar se tudo foi criado:

-- Ver profiles
SELECT * FROM public.profiles;

-- Ver alunos
SELECT * FROM public.students;

-- Ver exercícios
SELECT * FROM public.exercises;

-- Ver templates
SELECT 
    wt.name as template_name,
    wt.weekday,
    CASE wt.weekday
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
    END as dia_semana,
    COUNT(wte.id) as qtd_exercicios
FROM public.workout_templates wt
LEFT JOIN public.workout_template_exercises wte ON wte.template_id = wt.id
GROUP BY wt.id, wt.name, wt.weekday
ORDER BY wt.weekday;

-- Ver exercícios de cada template
SELECT 
    wt.name as template,
    e.name as exercicio,
    wte.target_sets as series,
    wte.target_reps as reps,
    wte.sort_order as ordem
FROM public.workout_template_exercises wte
JOIN public.workout_templates wt ON wt.id = wte.template_id
JOIN public.exercises e ON e.id = wte.exercise_id
ORDER BY wt.weekday, wte.sort_order;

-- =====================================================
-- DICAS DE USO
-- =====================================================
-- 1. Após executar este seed, faça logout e login como aluno
-- 2. Acesse /app/student/today em um dia que tenha template (segunda, quarta ou sexta)
-- 3. Registre o treino e teste as funcionalidades
-- 4. Faça logout e login como personal para ver a área do personal

-- Para testar em outros dias da semana, você pode criar mais templates
-- ou modificar temporariamente o weekday no código do app.
