/**
 * @file agentReport.controller.ts
 * @capa Controller (Controlador)
 *
 * @descripcion Recibe la petición HTTP del agente sobre SUS denuncias ya
 *               asignadas (listado, detalle, notas internas y cambio de estado).
 *               El pool de denuncias sin asignar vive en
 *               agentReportDetail.controller.ts y agentReportTake.controller.ts.
 *               No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as agentReportService from '../services/agentReport.service';
import { HttpError } from '../utils/HttpError';
import { parseId } from '../utils/parseId';
import { parseQueryInt, parseSearch } from '../utils/parseQueryInt';

const INVALID_PAGINATION =
  'Los parámetros page y limit deben ser números enteros positivos';

// GET /api/agent/reports?page=1&limit=5&search=
export const getMyReports = async (req: Request, res: Response) => {
  try {
    const page = parseQueryInt(req.query.page, 1);
    const limit = parseQueryInt(req.query.limit, 5);

    if (page === null || limit === null) {
      return res.status(400).json({ error: INVALID_PAGINATION });
    }

    const result = await agentReportService.listMyReports({
      agentId: req.agent!.id,
      page,
      limit,
      search: parseSearch(req.query.search),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al listar mis reportes:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/agent/reports/:id
export const getMyReportDetail = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const detail = await agentReportService.getMyReportDetail(id, req.agent!.id);

    if (!detail) {
      return res.status(404).json({ error: 'Denuncia no encontrada' });
    }

    return res.status(200).json(detail);
  } catch (error) {
    console.error('Error al obtener detalle de denuncia del agente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/agent/reports/:id/notes
export const addNote = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const note = await agentReportService.addNote(id, req.agent!.id, req.body.content);

    return res.status(201).json(note);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al agregar nota:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /api/agent/reports/:id/status
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const detail = await agentReportService.updateReportStatus(id, req.agent!.id, req.body);

    return res.status(200).json(detail);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al cambiar estado de denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};