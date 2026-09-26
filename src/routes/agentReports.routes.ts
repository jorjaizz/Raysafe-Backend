/**
 * @file agentReports.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "reportes del agente" y las
 *               conecta con sus controladores. Todas requieren autenticación
 *               JWT y rol Agente (requireAgent). Se montan en /api.
 *
 * OJO con el orden: Express matchea en orden de declaración, así que las rutas
 * literales ("/unassigned") deben declararse ANTES que las rutas con ":id".
 * Si "/agent/reports/:id" se declarara primero, se tragaría "/unassigned"
 * (y parseId respondería 400 "ID inválido").
 */
import { Router } from 'express';
import {
  addNote,
  getMyReportDetail,
  getMyReports,
  updateStatus,
} from '../controllers/agentReport.controller';
import {
  getUnassignedReportDetail,
  getUnassignedReports,
} from '../controllers/agentReportDetail.controller';
import { takeUnassignedReport } from '../controllers/agentReportTake.controller';
import { requireAgent } from '../middleware/agent.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createNoteSchema,
  takeReportSchema,
  updateStatusSchema,
} from '../schemas/agentReport.schema';

const router = Router();

// --- Denuncias sin asignar (pool institucional) ---
// Literales primero: deben ganarle a "/agent/reports/:id".
router.get('/agent/reports/unassigned', authenticate, requireAgent, getUnassignedReports);
router.get('/agent/reports/unassigned/:id', authenticate, requireAgent, getUnassignedReportDetail);
router.post(
  '/agent/reports/unassigned/:id/take',
  authenticate,
  requireAgent,
  validate(takeReportSchema),
  takeUnassignedReport,
);

// --- Denuncias asignadas al agente (mis reportes) ---
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
