import { z } from 'zod';

export const selectExercisesSchema = z.object({
  exerciseIds: z.array(z.string()).min(1, 'Selecione pelo menos um exercício'),
});

export type SelectExercisesDto = z.infer<typeof selectExercisesSchema>;
