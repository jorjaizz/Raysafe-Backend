/**
 * @file agentReportTake.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP para que un agente tome una denuncia sin
 *               asignar, delega la lógica al Service y devuelve la respuesta.
 *               El body ya viene validado con zod (takeReportSchema).
 *               No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as agentReportTakeService from '../services/agentReportTake.service';
import { parseId } from '../utils/parseId';
import { HttpError } from '../utils/HttpError';

// POST /api/agent/reports/unassigned/:id/take
export const takeUnassignedReport = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const { risk_level } = req.body;

    const result = await agentReportTakeService.takeUnassignedReport(
      id,
      req.agent!.id,
      req.agent!.institution_id,
      risk_level,
    );

    if (!result) {
      return res.status(404).json({
        error: 'Denuncia no encontrada, ya asignada, no está en estado "Recibida" o no pertenece a tu institución',
      });
    }

    return res.status(200).json({
      message: 'Denuncia asignada correctamente',
      report: result,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al tomar denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};