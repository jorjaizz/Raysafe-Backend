/**
 * @file auth.middleware.ts
 * @capa Middleware
 * @descripcion Protege rutas con JWT:
 *               - authenticate: valida el token Bearer y adjunta req.user.
 *               - authorize: restringe por rol (currying).
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

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    return next();
  };