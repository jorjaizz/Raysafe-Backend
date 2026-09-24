/**
 * @file auth.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "auth" y las conecta con sus
 *               controladores. Se montan en /api (ver app.ts).
 */
import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/auth/login', validate(loginSchema), login);
router.get('/auth/me', authenticate, me);

export default router;