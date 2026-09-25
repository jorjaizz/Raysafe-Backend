/**
 * @file agentReportDetail.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP del panel agente para ver detalle de denuncia,
 *               delega la lógica al Service y devuelve la respuesta. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as agentReportDetailService from '../services/agentReportDetail.service';
import { parseId } from '../utils/parseId';

// GET /api/agent/reports/unassigned/:id
export const getUnassignedReportDetail = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const detail = await agentReportDetailService.getUnassignedReportDetail(
      id,
      req.agent!.institution_id,
    );

    if (!detail) {
      return res.status(404).json({ error: 'Denuncia no encontrada o ya asignada' });
    }

    return res.status(200).json(detail);
  } catch (error) {
    console.error('Error al obtener detalle de denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};