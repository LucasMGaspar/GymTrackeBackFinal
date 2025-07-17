import { z } from 'zod';

export const registerSeriesSchema = z.object({
  weight: z.number().min(0, 'Peso deve ser maior ou igual a zero'),
  reps: z.number().int().min(0, 'Repetições devem ser maior ou igual a zero'),
  restTime: z.number().int().min(0).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export type RegisterSeriesDto = z.infer<typeof registerSeriesSchema>;
