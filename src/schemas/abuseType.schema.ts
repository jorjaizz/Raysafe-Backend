/**
 * @file abuseType.schema.ts
 * @capa Validation (Validación)
 * @descripcion Esquemas de zod para validar los datos que llegan en el body
 *               de las peticiones del módulo "abuse_types".
 *
 * Paquete usado:
 * - zod -> valida campos, tipos y longitudes.
 */
import { z } from 'zod';

export const abuseTypeSchema = z.object({
  category: z.enum(['human', 'animal'], {
    errorMap: () => ({ message: "La categoría debe ser 'human' o 'animal'" }),
  }),
  name: z.string().min(1, 'El nombre es obligatorio').max(80, 'El nombre supera los 80 caracteres'),
  description: z.string().max(250, 'La descripción supera los 250 caracteres').nullable().optional(),
});