/**
 * @file agentReport.schema.ts
 * @capa Validation (Validación)
 * @descripcion Esquemas de zod para validar el body del endpoint "tomar denuncia".
 */
import { z } from 'zod';

export const takeReportSchema = z.object({
  risk_level: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Nivel de riesgo debe ser: low, medium, high o critical' })
  })
});