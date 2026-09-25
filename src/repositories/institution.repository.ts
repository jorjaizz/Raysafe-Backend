/**
 * @file institution.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del modulo "institutions" contra MySQL.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface Institution {
  id: number;
  name: string;
  category: 'human' | 'animal';
  type: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export const findInstitutionById = async (id: number): Promise<Institution | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category, type, phone, email, active
     FROM institutions
     WHERE id = ?`,
    [id],
  );

  return (rows[0] as Institution) ?? null;
};