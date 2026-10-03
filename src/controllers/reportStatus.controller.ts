/**
 * @file reportStatus.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as reportStatusService from '../services/reportStatus.service';

// GET /api/report-statuses
export const getReportStatuses = async (_req: Request, res: Response) => {
  try {
    const statuses = await reportStatusService.getReportStatuses();
    return res.status(200).json(statuses);
  } catch (error) {
    console.error('Error al obtener report_statuses:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};