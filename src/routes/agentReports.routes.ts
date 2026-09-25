/**
 * @file agentReports.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "reportes del agente" y las
 *               conecta con sus controladores. Todas requieren autenticación
 *               JWT y rol Agente (requireAgent). Se montan en /api.
 */
import { Router } from 'express';
import { getUnassignedReports } from '../controllers/agentReport.controller';
import { getUnassignedReportDetail } from '../controllers/agentReportDetail.controller';
import { takeUnassignedReport } from '../controllers/agentReportTake.controller';
import { requireAgent } from '../middleware/agent.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/agent/reports/unassigned', authenticate, requireAgent, getUnassignedReports);
router.get('/agent/reports/unassigned/:id', authenticate, requireAgent, getUnassignedReportDetail);
router.post('/agent/reports/unassigned/:id/take', authenticate, requireAgent, takeUnassignedReport);

export default router;