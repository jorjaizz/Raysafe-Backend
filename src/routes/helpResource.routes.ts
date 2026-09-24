/**
 * @file helpResource.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "help_resources".
 *               Es un catálogo público (sin autenticación) para el frontend.
 */
import { Router } from 'express';
import { getHelpResources } from '../controllers/helpResource.controller';

const router = Router();

router.get('/help-resources', getHelpResources);

export default router;