/**
 * @file error.middleware.ts
 * @capa Middleware
 * @descripcion Manejo centralizado de errores:
 *               - notFoundHandler: responde 404 para rutas inexistentes.
 *               - errorHandler: captura errores lanzados en cualquier parte y
 *                 responde 500 sin exponer detalles internos al cliente.
 *
 * Paquete base:
 * - express -> los middlewares son funciones (req, res, next).
 */
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/HttpError';

export const notFoundHandler = (_req: Request, res: Response) => {
  return res.status(404).json({ error: 'Ruta no encontrada' });
};

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' });
  }

  const status = err.status ?? err.statusCode;

  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message || 'Error en la petición' });
  }

  console.error('Error:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};