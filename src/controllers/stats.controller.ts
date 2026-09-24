/**
 * @file stats.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as statsService from '../services/stats.service';

// GET /api/stats/dashboard
export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const dashboard = await statsService.getDashboard();
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error al obtener el dashboard de estadísticas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};