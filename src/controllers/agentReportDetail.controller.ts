/**
 * @file agentReportDetail.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe las peticiones HTTP del panel agente para el pool de
 *               denuncias sin asignar: listado paginado y detalle completo con
 *               evidencia. Delega la lógica al Service y devuelve la respuesta.
 *               No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as agentReportDetailService from '../services/agentReportDetail.service';
import { parseId } from '../utils/parseId';
import { parseQueryInt, parseSearch } from '../utils/parseQueryInt';

const INVALID_PAGINATION =
  'Los parámetros page y limit deben ser números enteros positivos';

// GET /api/agent/reports/unassigned?page=1&limit=5&search=
export const getUnassignedReports = async (req: Request, res: Response) => {
  try {
    const page = parseQueryInt(req.query.page, 1);
    const limit = parseQueryInt(req.query.limit, 5);

    if (page === null || limit === null) {
      return res.status(400).json({ error: INVALID_PAGINATION });
    }

    const result = await agentReportDetailService.listUnassignedReports({
      institutionId: req.agent!.institution_id,
      page,
      limit,
      search: parseSearch(req.query.search),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al listar denuncias sin asignar:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

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