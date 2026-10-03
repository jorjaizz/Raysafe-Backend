/**
 * @file auth.schema.ts
 * @capa Validation (Validación)
 * @descripcion Esquema de zod para validar el body del login.
 *
 * Paquete usado:
 * - zod -> valida campos, tipos y longitudes.
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('El email no es válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});