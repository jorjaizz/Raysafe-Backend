/**
 * @file report.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "reports". La creación es
 *               pública: cualquier persona puede denunciar sin estar
 *               autenticada. Las evidencias las sube el denunciante con
 *               su public_id + token de seguimiento.
 */
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { uploadEvidence } from '../config/uploads';
import {
  deleteEvidence,
  getEvidenceList,
  getReportTrack,
  patchEvidence,
  postEvidence,
  postReport,
  putReportTrack,
} from '../controllers/report.controller';
import { validate } from '../middleware/validate.middleware';
import { createReportSchema, updateTrackerSchema } from '../schemas/report.schema';

// Envuelve el upload para responder JSON bonito en vez del error plano de multer.
const uploadSingleEvidence = (req: Request, res: Response, next: NextFunction) => {
  uploadEvidence.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'El archivo supera el límite de 10 MB' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Solo se permite un archivo por petición' });
        }
        return res.status(400).json({ error: err.message });
      }

      return res.status(400).json({ error: err instanceof Error ? err.message : 'Error al subir el archivo' });
    }

    return next();
  });
};

const router = Router();

router.post('/reports', validate(createReportSchema), postReport);
router.post('/reports/:publicId/evidence', uploadSingleEvidence, postEvidence);
router.get('/reports/track/:publicId', getReportTrack);
router.get('/reports/:publicId/evidence', getEvidenceList);
router.put('/reports/track/:publicId', validate(updateTrackerSchema), putReportTrack);
router.delete('/reports/:publicId/evidence/:evidenceId', deleteEvidence);
router.patch('/reports/:publicId/evidence/:evidenceId', patchEvidence);

export default router;