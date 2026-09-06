/**
 * @file ApiResponse.ts
 * @capa Utils (Utilidades)
 * @descripcion Formato de respuesta estándar para todos los endpoints,
 *               así el cliente siempre recibe JSON con la misma estructura.
 */
import type { Response } from 'express';

export const ApiResponse = {
  ok(res: Response, data: unknown, status = 200) {
    return res.status(status).json({ success: true, data });
  },
  error(res: Response, message: string, status = 500) {
    return res.status(status).json({ success: false, error: message });
  },
};