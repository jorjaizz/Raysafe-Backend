/**
 * @file adminReport.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del modulo "registros de denuncias" del panel
 *               admin y las conecta con sus controladores. Se montan en /api.
 */
import { Router } from 'express';
import { getReportDetail, getReportLogs } from '../controllers/adminReport.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// authenticate + requireAdmin en las dos: primero confirmas que hay sesion (jwt),
// luego confirmas que el usuario sea admin (role 'admin'). un doble candado, sixe ven.
router.get('/admin/reports', authenticate, requireAdmin, getReportLogs);
router.get('/admin/reports/:id', authenticate, requireAdmin, getReportDetail);

export default router;