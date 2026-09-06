/**
 * @file health.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente usando ApiResponse.
 */
import type { Request, Response } from 'express';
import { checkDatabase } from '../services/health.service';
import { ApiResponse } from '../utils/ApiResponse';

// GET /api/health
export const getHealth = async (_req: Request, res: Response) => {
  const databaseOk = await checkDatabase();

  return ApiResponse.ok(res, {
    status: 'ok',
    database: databaseOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};