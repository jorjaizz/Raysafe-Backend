/**
 * @file agentReport.schema.ts
 * @capa Validation (Validación)
 * @descripcion Esquemas de zod del módulo "denuncias del agente":
 *               - createNoteSchema: valida el body del POST (nota interna).
 *               - updateStatusSchema: valida el body del PATCH (cambio de estado).
 *               - takeReportSchema: valida el body del POST (tomar denuncia).
 *
 * Paquete usado:
 * - zod -> valida campos, tipos y longitudes.
 */
import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'El contenido de la nota es obligatorio')
    .max(2000, 'La nota supera los 2000 caracteres'),
});

export const updateStatusSchema = z.object({
  status_id: z.number().int().positive('El estado es invalido'),
  comment: z
    .string()
    .max(2000, 'El comentario supera los 2000 caracteres')
    .optional(),
});

// Coincide con el ENUM risk_level de la tabla reports.
const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'], {
  errorMap: () => ({ message: 'El nivel de riesgo debe ser: low, medium, high o critical' }),
});

export const takeReportSchema = z.object({
  risk_level: riskLevelSchema,
});