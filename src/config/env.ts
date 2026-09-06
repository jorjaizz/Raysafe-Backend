/**
 * @file env.ts
 * @capa Config (Configuración)
 * @descripcion Valida las variables de entorno al arrancar la app.
 *
 * Paquetes usados:
 * - dotenv   -> carga el archivo .env a process.env
 * - zod      -> valida que las variables existan y tengan el formato esperado,
 *               y muestra un error claro si falta alguna.
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;