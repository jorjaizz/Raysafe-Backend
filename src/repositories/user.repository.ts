/**
 * @file user.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "users" contra MySQL.
 *               Única capa que conoce la base de datos.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  institutionId: number;
  institutionName: string;
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: string;
  institutionId: number;
  institutionName: string;
}

export const findByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, u.password, r.name AS role, u.institution_id AS institutionId, i.name AS institutionName
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN institutions i ON i.id = u.institution_id
     WHERE u.email = ? AND u.active = TRUE`,
    [email],
  );

  return (rows[0] as User) ?? null;
};

export const findById = async (id: number): Promise<PublicUser | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, r.name AS role, u.institution_id AS institutionId, i.name AS institutionName
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN institutions i ON i.id = u.institution_id
     WHERE u.id = ? AND u.active = TRUE`,
    [id],
  );

  return (rows[0] as PublicUser) ?? null;
};