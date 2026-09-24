/**
 * @file adminReport.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la peticion HTTP del panel admin (registros de denuncias),
 *               delega la logica al Service y devuelve la respuesta.
 *               No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as adminReportService from '../services/adminReport.service';
import { parseId } from '../utils/parseId';

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

// GET /api/admin/reports?page=1&limit=10&search=
export const getReportLogs = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);

    if (page === null || limit === null) {
      return res.status(400).json({
        error: 'Los parametros page y limit deben ser numeros enteros positivos',
      });
    }

    const result = await adminReportService.listReportLogs({
      institutionId: req.admin!.institution_id,
      page,
      limit,
      search,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al listar registros de denuncias:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/admin/reports/:id
export const getReportDetail = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const detail = await adminReportService.getReportDetail(id, req.admin!.institution_id);

    if (!detail) {
      return res.status(404).json({ error: 'Denuncia no encontrada' });
    }

    return res.status(200).json(detail);
  } catch (error) {
    console.error('Error al obtener detalle de denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};