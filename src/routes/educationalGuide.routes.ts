/**
 * @file educationalGuide.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "educational_guides".
 *               Es un catálogo público (sin autenticación) para el frontend.
 */
import { Router } from 'express';
import { getEducationalGuides } from '../controllers/educationalGuide.controller';

const router = Router();

router.get('/educational-guides', getEducationalGuides);

export default router;