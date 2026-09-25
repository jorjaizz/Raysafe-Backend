/**
 * @file agent.d.ts
 * @descripcion Extiende Express.Request con el contexto del agente
 *               autenticado (req.agent) para las rutas del agente.
 *               No modifica express.d.ts: los archivos .d.ts se fusionan.
 */
declare namespace Express {
  interface Request {
    agent?: {
      id: number;
      role: string;
      role_id: number;
      institution_id: number;
    };
  }
}