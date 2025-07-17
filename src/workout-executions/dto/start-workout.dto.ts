import { z } from 'zod';

export const startWorkoutSchema = z.object({
  muscleGroups: z
    .array(z.string())
    .min(1, 'Selecione pelo menos um grupo muscular'),
  notes: z.string().optional(),
});

export type StartWorkoutDto = z.infer<typeof startWorkoutSchema>;
