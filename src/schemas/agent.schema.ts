/**
 * @file agent.schema.ts
 * @capa Validation (Validación)
 * @descripcion Esquemas de zod del módulo "administración de agentes":
 *               - createAgentSchema: valida el body del POST (alta de agente).
 *               - updateAgentSchema: valida el body del PATCH (rol/estado).
 *
 * Paquete usado:
 * - zod -> valida campos, tipos y que se envíe al menos un campo.
 */
import { z } from 'zod';

// Roles que soporta el form del frontend ("agent"/"admin"). El service los
// traduce a los nombres reales de la tabla `roles` ('agente'/'admin').
export const agentRoleEnum = z.enum(['agent', 'admin']);

export const createAgentSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(120, 'El nombre supera los 120 caracteres'),
  email: z.string().email('El email no es válido').max(150, 'El email supera los 150 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100, 'La contraseña es demasiado larga'),
  role: agentRoleEnum.default('agent'),
});

const roleIdSchema = z.union([
  z.number().int().positive('El rol es inválido'),
  z.string().regex(/^\d+$/, 'El rol es inválido').transform((value) => Number(value)),
]);

const activeSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1'),
]);

export const updateAgentSchema = z
  .object({
    roleId: roleIdSchema.optional(),
    active: activeSchema.optional(),
  })
  .refine(
    (data) => data.roleId !== undefined || data.active !== undefined,
    { message: 'Debes enviar al menos un campo a modificar' },
  );