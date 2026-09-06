/**
 * @file database.ts
 * @capa Config (Configuración)
 * @descripcion Instancia única del cliente de Prisma, compartida por toda la app.
 *
 * Paquetes usados:
 * - @prisma/client -> cliente tipado para ejecutar consultas contra PostgreSQL.
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();