/**
 * @file abuseType.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "abuse_types" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { HttpError } from '../utils/HttpError';

export interface AbuseType {
  id: number;
  category: 'human' | 'animal';
  name: string;
  description: string | null;
}

export interface AbuseTypeInput {
  category: 'human' | 'animal';
  name: string;
  description?: string | null;
}

const SELECT_COLUMNS = 'id, category, name, description';

export const findAll = async (category?: 'human' | 'animal'): Promise<AbuseType[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM abuse_types ${category ? 'WHERE category = ?' : ''} ORDER BY id`,
    category ? [category] : [],
  );

  return rows as AbuseType[];
};

export const findById = async (id: number): Promise<AbuseType | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM abuse_types WHERE id = ?`,
    [id],
  );

  return (rows[0] as AbuseType) ?? null;
};

export const insert = async (data: AbuseTypeInput): Promise<AbuseType> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO abuse_types (category, name, description) VALUES (?, ?, ?)',
    [data.category, data.name, data.description ?? null],
  );

  return { id: result.insertId, category: data.category, name: data.name, description: data.description ?? null };
};

export const update = async (id: number, data: AbuseTypeInput): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE abuse_types SET category = ?, name = ?, description = ? WHERE id = ?',
    [data.category, data.name, data.description ?? null, id],
  );

  return result.affectedRows > 0;
};

export const remove = async (id: number): Promise<boolean> => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM abuse_types WHERE id = ?',
      [id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'ER_ROW_IS_REFERENCED_2'
    ) {
      throw new HttpError(
        409,
        'No se puede eliminar el tipo de abuso porque está asociado a reportes',
      );
    }

    throw error;
  }
};