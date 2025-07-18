import { z } from 'zod';

// ADICIONADO: Lista de grupos musculares válidos (em minúscula)
const validMuscleGroups = [
  'chest',
  'back', 
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'abs',
  'calves',
  'cardio'
] as const;

export const createExerciseSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  muscleGroups: z
    .array(z.enum(validMuscleGroups)) // ALTERADO: Agora valida contra enum específico
    .min(1, 'Selecione pelo menos um grupo muscular'),
  equipment: z.string().optional(),
  instructions: z.string().optional(),
});

export type CreateExerciseDto = z.infer<typeof createExerciseSchema>;