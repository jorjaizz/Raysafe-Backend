/**
 * @file abuseType.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "abuse_types" y las conecta con sus
 *               controladores. Estas rutas se montan en /api (ver app.ts).
 *               La lectura es publica; la escritura requiere autenticación JWT
 *               y rol Administrador (authenticate + requireAdmin).
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
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { abuseTypeSchema } from '../schemas/abuseType.schema';

const router = Router();

// Lectura pública: la necesita el formulario de denuncia para listar el catalogo.
router.get('/abuse-types', getAbuseTypes);
router.get('/abuse-types/:id', getAbuseType);

// Escritura restringida a admin: administran el catalogo, no puede hacerlo un anonimo.
router.post('/abuse-types', authenticate, requireAdmin, validate(abuseTypeSchema), postAbuseType);
router.put('/abuse-types/:id', authenticate, requireAdmin, validate(abuseTypeSchema), putAbuseType);
router.delete('/abuse-types/:id', authenticate, requireAdmin, deleteAbuseType);

export default router;