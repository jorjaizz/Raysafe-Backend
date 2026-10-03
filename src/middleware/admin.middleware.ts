/**
 * @file admin.middleware.ts
 * @capa Middleware
 * @descripcion requireAdmin: restringe rutas al rol 'admin' (role_id = 2).
 *               Compara por nombre de rol, no por role_id fijo.
 *               Resuelve role_id e institution_id consultando la BD a partir del
 *               id puesto por authenticate (reutiliza req.user sin modificarlo)
 *               y adjunta el contexto en req.admin.
 */
import type { NextFunction, Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

interface AdminRow {
  id: number;
  role: string;
  role_id: number;
  institution_id: number;
}

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
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

    const admin = rows[0] as AdminRow | undefined;

    if (!admin) {
      return res.status(401).json({ error: 'Usuario no encontrado o desactivado' });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    req.admin = {
      id: admin.id,
      role: admin.role,
      role_id: admin.role_id,
      institution_id: admin.institution_id,
    };

    return next();
  } catch (error) {
    console.error('Error en requireAdmin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};