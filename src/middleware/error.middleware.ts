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

export const notFoundHandler = (_req: Request, res: Response) => {
  return res.status(404).json({ error: 'Ruta no encontrada' });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('Error:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};