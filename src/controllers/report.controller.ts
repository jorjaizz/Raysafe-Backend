/**
 * @file report.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { HttpError } from '../utils/HttpError';

const PUBLIC_ID_REGEX = /^DN-\d{4}-\d{4}$/;

const getPublicId = (req: Request, res: Response): string | null => {
  const { publicId } = req.params;

  if (!PUBLIC_ID_REGEX.test(publicId)) {
    res.status(400).json({ error: 'El public_id debe tener el formato DN-XXXX-XXXX' });
    return null;
  }

  return publicId;
};

// POST /api/reports
export const postReport = async (req: Request, res: Response) => {
  try {
    const created = await reportService.createReport(req.body);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al crear reporte:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/reports/track/:publicId[?token=X]
export const getReportTrack = async (req: Request, res: Response) => {
  try {
    const publicId = getPublicId(req, res);
    if (publicId === null) return;

    const token =
      typeof req.query.token === 'string' && req.query.token.trim() !== ''
        ? req.query.token.trim()
        : undefined;

    const result = await reportService.getReportTrack(publicId, token);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al consultar denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PUT /api/reports/track/:publicId
export const putReportTrack = async (req: Request, res: Response) => {
  try {
    const publicId = getPublicId(req, res);
    if (publicId === null) return;

    const { token, ...fields } = req.body;
    const updated = await reportService.updateReportByReporter(publicId, token, fields);
    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al modificar denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};