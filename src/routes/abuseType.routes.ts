/**
 * @file abuseType.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "abuse_types" y las conecta con sus
 *               controladores. Estas rutas se montan en /api (ver app.ts).
 *
 * Paquetes usados:
 * - express (Router) -> gestiona los endpoints y métodos HTTP.
 * - zod (vía validate) -> valida el body antes de llegar al controlador.
 */
import { Router } from 'express';
import {
  deleteAbuseType,
  getAbuseType,
  getAbuseTypes,
  postAbuseType,
  putAbuseType,
} from '../controllers/abuseType.controller';
import { validate } from '../middleware/validate.middleware';
import { abuseTypeSchema } from '../schemas/abuseType.schema';

const router = Router();

router.get('/abuse-types', getAbuseTypes);
router.get('/abuse-types/:id', getAbuseType);
router.post('/abuse-types', validate(abuseTypeSchema), postAbuseType);
router.put('/abuse-types/:id', validate(abuseTypeSchema), putAbuseType);
router.delete('/abuse-types/:id', deleteAbuseType);

export default router;