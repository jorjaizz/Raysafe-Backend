/**
 * @file report.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import { removeStoredFile } from '../config/uploads';
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

const parseEvidenceId = (req: Request, res: Response): number | null => {
  const id = Number(req.params.evidenceId);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'ID de evidencia inválido' });
    return null;
  }

  return id;
};

// POST /api/reports/:publicId/evidence
export const postEvidence = async (req: Request, res: Response) => {
  const publicId = getPublicId(req, res);
  if (publicId === null) return;

  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Debes enviar un archivo en el campo "file"' });
  }

  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : undefined;

    const created = await reportService.addEvidence(publicId, token, {
      filename: file.filename,
      mimetype: file.mimetype,
    }, description);

    return res.status(201).json(created);
  } catch (error) {
    // Si la operación falla (token inválido, denuncia inexistente, error de BD),
    // borramos el archivo recién guardado para no dejar basura en el disco.
    await removeStoredFile(file.filename).catch(() => undefined);

    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al subir evidencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/reports/:publicId/evidence
export const getEvidenceList = async (req: Request, res: Response) => {
  try {
    const publicId = getPublicId(req, res);
    if (publicId === null) return;

    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    const evidence = await reportService.listEvidence(publicId, token);
    return res.status(200).json(evidence);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al listar evidencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /api/reports/:publicId/evidence/:evidenceId
export const patchEvidence = async (req: Request, res: Response) => {
  try {
    const publicId = getPublicId(req, res);
    if (publicId === null) return;

    const evidenceId = parseEvidenceId(req, res);
    if (evidenceId === null) return;

    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'El token es obligatorio' });
    }

    const description = typeof req.body?.description === 'string' ? req.body.description : undefined;

    const updated = await reportService.updateEvidenceDescription(
      publicId,
      token,
      evidenceId,
      description,
    );
    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al modificar evidencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /api/reports/:publicId/evidence/:evidenceId
export const deleteEvidence = async (req: Request, res: Response) => {
  try {
    const publicId = getPublicId(req, res);
    if (publicId === null) return;

    const evidenceId = parseEvidenceId(req, res);
    if (evidenceId === null) return;

    const token =
      (typeof req.body?.token === 'string' ? req.body.token.trim() : '') ||
      (typeof req.query.token === 'string' ? req.query.token.trim() : '');

    await reportService.deleteEvidenceById(publicId, token, evidenceId);
    return res.status(200).json({ message: 'Evidencia eliminada' });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al eliminar evidencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};