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
import { ApiResponse } from '../utils/ApiResponse';

export const notFoundHandler = (_req: Request, res: Response) => {
  return ApiResponse.error(res, 'Ruta no encontrada', 404);
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('Error:', err);
  return ApiResponse.error(res, 'Error interno del servidor', 500);
};