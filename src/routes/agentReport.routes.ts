/**
 * @file agentReport.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "denuncias del agente": listado y
 *               detalle de las denuncias asignadas, notas internas y cambio de
 *               estado. Todas requieren autenticación JWT y rol agente
 *               (requireAgent). Se montan en /api.
 */
import { Router } from 'express';
import { addNote, getMyReportDetail, getMyReports, updateStatus } from '../controllers/agentReport.controller';
import { requireAgent } from '../middleware/agent.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createNoteSchema, updateStatusSchema } from '../schemas/agentReport.schema';

const router = Router();

router.get('/agent/reports', authenticate, requireAgent, getMyReports);
router.get('/agent/reports/:id', authenticate, requireAgent, getMyReportDetail);
router.post(
  '/agent/reports/:id/notes',
  authenticate,
  requireAgent,
  validate(createNoteSchema),
  addNote,
);
router.patch(
  '/agent/reports/:id/status',
  authenticate,
  requireAgent,
  validate(updateStatusSchema),
  updateStatus,
);

export default router;