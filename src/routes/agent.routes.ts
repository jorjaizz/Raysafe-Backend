/**
 * @file agent.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "administración de agentes" y las
 *               conecta con sus controladores. Todas requieren autenticación
 *               JWT y rol Administrador (requireAdmin). Se montan en /api.
 */
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createAgent, getAgent, getAgents, updateAgent } from '../controllers/agent.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAgentSchema, updateAgentSchema } from '../schemas/agent.schema';

// Bloquea que el admin autenticado modifique su propia cuenta (requiere login.
// req.user.id proviene del token JWT).
const cannotEditSelf = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);

  if (req.user && id === req.user.id) {
    return res.status(400).json({ error: 'No puedes modificar tu propia cuenta' });
  }

  return next();
};

const router = Router();

router.post('/admin/agents', authenticate, requireAdmin, validate(createAgentSchema), createAgent);
router.get('/admin/agents', authenticate, requireAdmin, getAgents);
router.get('/admin/agents/:id', authenticate, requireAdmin, getAgent);
router.patch(
  '/admin/agents/:id',
  authenticate,
  requireAdmin,
  cannotEditSelf,
  validate(updateAgentSchema),
  updateAgent,
);

export default router;