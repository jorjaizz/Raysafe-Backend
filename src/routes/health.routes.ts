/**
 * @file health.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "health" y las conecta con sus
 *               controladores. Estas rutas se montan en /api (ver app.ts).
 *
 * Paquetes usados:
 * - express (Router) -> gestiona los endpoints y métodos HTTP.
 */
import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

const router = Router();

router.get('/health', getHealth);

export default router;