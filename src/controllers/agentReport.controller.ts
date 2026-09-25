/**
 * @file agentReport.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP del panel agente, delega la lógica al
 *               Service y devuelve la respuesta. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as agentReportService from '../services/agentReport.service';

const parsePositiveInt = (value: unknown, fallback: number): number | null => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const n = Number(value);

  if (!Number.isInteger(n) || n < 1) {
    return null;
  }

  return n;
};

// GET /api/agent/reports/unassigned?page=1&limit=10&search=
export const getUnassignedReports = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);

    if (page === null || limit === null) {
      return res.status(400).json({
        error: 'Los parámetros page y limit deben ser números enteros positivos',
      });
    }

    const result = await agentReportService.listUnassignedReports({
      institutionId: req.agent!.institution_id,
      page,
      limit,
      search,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al listar denuncias sin asignar:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};