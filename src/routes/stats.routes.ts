/**
 * @file stats.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "estadísticas/dashboard".
 *               Es un catálogo público (sin autenticación) para el frontend.
 */
import { Router } from 'express';
import { getDashboard } from '../controllers/stats.controller';

const router = Router();

router.get('/stats/dashboard', getDashboard);

export default router;