/**
 * @file health.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del health check: comprueba si la base de datos
 *               responde. Esta capa NO conoce HTTP (no recibe req/res).
 */
import { prisma } from '../config/database';

export const checkDatabase = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};