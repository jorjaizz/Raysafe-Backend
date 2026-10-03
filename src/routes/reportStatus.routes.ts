/**
 * @file reportStatus.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "report_statuses".
 *               Es un catálogo público (sin autenticación) para el frontend:
 *               permite dibujar la línea de tiempo del estado de una denuncia.
 */
import { Router } from 'express';
import { getReportStatuses } from '../controllers/reportStatus.controller';

const router = Router();

router.get('/report-statuses', getReportStatuses);

export default router;