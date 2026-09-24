/**
 * @file express.d.ts
 * @descripcion Extiende la interfaz global de Express para que `req.user`
 *               exista en todos los controladores sin re-declararlo.
 */
declare namespace Express {
  interface Request {
    user?: { id: number; role: string };
  }
}