/**
 * @file database.ts
 * @capa Config (Configuración)
 * @descripcion Pool de conexiones MySQL compartido por toda la app.
 *
 * Paquetes usados:
 * - mysql2 -> cliente nativo de MySQL (sin ORM) con soporte de promesas.
 */
import { createPool } from 'mysql2/promise';
import { env } from './env';

export const pool = createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});