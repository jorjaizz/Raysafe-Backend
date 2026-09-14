/**
 * @file validate.middleware.ts
 * @capa Middleware
 * @descripcion Valida el body de una petición con un esquema de zod.
 *               Si es válido, deja el body parseado en req.body y pasa
 *               a la siguiente función; si no, responde 400 con los errores.
 *
 * Paquete usado:
 * - zod -> esquema de validación.
 */
import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data;
    return next();
  };