/**
 * @file auth.middleware.ts
 * @capa Middleware
 * @descripcion Protege rutas con JWT: authenticate valida el token Bearer
 *               y adjunta req.user. El control de rol vive en requireAdmin
 *               y requireAgent (middleware/admin.middleware.ts y
 *               middleware/agent.middleware.ts).
 *
 * Paquetes usados:
 * - jsonwebtoken -> verifica la firma y la expiración del token.
 */
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  sub: number;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload;
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};