import { z } from 'zod';

export const updateHealthProfileSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    edad: z.number().min(1, 'Age must be valid').max(120),
    peso: z.number().min(10, 'Weight must be valid').max(350),
    altura: z.number().min(40, 'Height must be valid').max(260),
    genero: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo']),
    bpmReposo: z.number().min(30).max(200),
    ansiedad: z.boolean().optional(),
    condiciones: z.array(z.string()).optional(),
  })
});

export type UpdateHealthProfileDto = z.infer<typeof updateHealthProfileSchema>['body'];
