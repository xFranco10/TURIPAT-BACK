import { z } from 'zod';

/**
 * ESQUEMAS ZOD — validación de toda entrada externa (body/params/query).
 * Los controllers reciben ya parseados gracias al middleware validate().
 * Tipos de entrada = z.infer<typeof schema>.
 */
export const createExampleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(80, 'El nombre no puede superar 80 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('El id debe ser un UUID válido'),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>;
