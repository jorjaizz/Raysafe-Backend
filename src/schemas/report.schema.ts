/**
 * @file report.schema.ts
 * @capa Validation (Validación)
 * @descripcion Esquemas de zod para validar los datos que llegan en el body
 *               de las peticiones del módulo "reports".
 */
import { z } from 'zod';

export const createReportSchema = z.object({
  abuse_type_id: z.number().int().positive('El tipo de abuso es obligatorio'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(5000, 'La descripción supera los 5000 caracteres'),
  specific_address: z
    .string()
    .max(250, 'La dirección específica supera los 250 caracteres')
    .optional(),
  location_id: z.number().int().positive('La ubicación es inválida').optional(),
  notification_email: z
    .string()
    .email('El email no es válido')
    .max(150, 'El email supera los 150 caracteres')
    .optional(),
});

export const updateTrackerSchema = z
  .object({
    token: z.string().min(1, 'El token es obligatorio'),
    description: z
      .string()
      .min(1, 'La descripción es obligatoria')
      .max(5000, 'La descripción supera los 5000 caracteres')
      .optional(),
    specific_address: z
      .string()
      .max(250, 'La dirección específica supera los 250 caracteres')
      .nullable()
      .optional(),
    location_id: z.number().int().positive('La ubicación es inválida').nullable().optional(),
    notification_email: z
      .string()
      .email('El email no es válido')
      .max(150, 'El email supera los 150 caracteres')
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.description !== undefined ||
      data.specific_address !== undefined ||
      data.location_id !== undefined ||
      data.notification_email !== undefined,
    { message: 'Debes enviar al menos un campo a modificar' },
  );