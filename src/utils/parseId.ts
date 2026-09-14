/**
 * @file parseId.ts
 * @capa Utils (Utilidades)
 * @descripcion Parsea el :id de una ruta y valida que sea un entero positivo.
 *               Si no lo es, responde 400 y devuelve null (el controlador
 *               debe cortar la ejecución cuando recibe null).
 */
import type { Request, Response } from 'express';

export const parseId = (req: Request, res: Response): number | null => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }

  return id;
};