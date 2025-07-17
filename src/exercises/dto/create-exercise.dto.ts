import { z } from 'zod';

export const createExerciseSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  muscleGroups: z
    .array(z.string())
    .min(1, 'Selecione pelo menos um grupo muscular'),
  equipment: z.string().optional(),
  instructions: z.string().optional(),
});

export type CreateExerciseDto = z.infer<typeof createExerciseSchema>;
