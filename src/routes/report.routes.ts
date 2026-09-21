/**
 * @file report.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "reports". La creación es
 *               pública: cualquier persona puede denunciar sin estar
 *               autenticada.
 */
import { Router } from 'express';
import {
  getReportTrack,
  postReport,
  putReportTrack,
} from '../controllers/report.controller';
import { validate } from '../middleware/validate.middleware';
import { createReportSchema, updateTrackerSchema } from '../schemas/report.schema';

const router = Router();

router.post('/reports', validate(createReportSchema), postReport);
router.get('/reports/track/:publicId', getReportTrack);
router.put('/reports/track/:publicId', validate(updateTrackerSchema), putReportTrack);

export default router;