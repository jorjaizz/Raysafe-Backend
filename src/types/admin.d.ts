/**
 * @file admin.d.ts
 * @descripcion Extiende Express.Request con el contexto del administrador
 *               autenticado (req.admin) para las rutas del panel de admin.
 *               No modifica express.d.ts: los archivos .d.ts se fusionan.
 */
declare namespace Express {
  interface Request {
    admin?: {
      id: number;
      role: string;
      role_id: number;
      institution_id: number;
    };
  }
}