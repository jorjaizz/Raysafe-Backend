/**
 * @file agent.middleware.ts
 * @capa Middleware

 * @descripcion requireAgent: restringe rutas al rol Agente (role 'agente').
 * @descripcion requireAgent: restringe rutas al rol Agente (role_id = 1).

 *               Resuelve role_id e institution_id consultando la BD a partir del
 *               id puesto por authenticate (reutiliza req.user sin modificarlo)
 *               y adjunta el contexto en req.agent.
 */
import type { NextFunction, Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

interface AgentRow {
  id: number;
  role: string;
  role_id: number;
  institution_id: number;
}

export const requireAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, r.name AS role, u.role_id, u.institution_id
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.active = TRUE`,
      [req.user.id],
    );

    const agent = rows[0] as AgentRow | undefined;

    if (!agent) {
      return res.status(401).json({ error: 'Usuario no encontrado o desactivado' });
    }

    if (agent.role !== 'agente') {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    req.agent = {
      id: agent.id,
      role: agent.role,
      role_id: agent.role_id,
      institution_id: agent.institution_id,
    };

    return next();
  } catch (error) {
    console.error('Error en requireAgent:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};