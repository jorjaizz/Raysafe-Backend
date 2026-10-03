/**
 * @file evidence.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "evidence" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface Evidence {
  id: number;
  report_id: number;
  file_type: string | null;
  file_url: string;
  description: string | null;
  uploaded_at: string;
}

export interface InsertEvidenceInput {
  report_id: number;
  file_type: string;
  file_url: string;
  description: string | null;
}

const SELECT_COLUMNS = `id, report_id, file_type, file_url, description,
       DATE_FORMAT(uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at`;

export const insertEvidence = async (data: InsertEvidenceInput): Promise<Evidence> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO evidence (report_id, file_type, file_url, description)
     VALUES (?, ?, ?, ?)`,
    [data.report_id, data.file_type, data.file_url, data.description],
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM evidence WHERE id = ?`,
    [result.insertId],
  );

  return rows[0] as Evidence;
};

export const findEvidenceById = async (id: number): Promise<Evidence | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM evidence WHERE id = ?`,
    [id],
  );

  return (rows[0] as Evidence | undefined) ?? null;
};

export const listEvidenceByReportId = async (reportId: number): Promise<Evidence[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_COLUMNS} FROM evidence WHERE report_id = ? ORDER BY id`,
    [reportId],
  );

  return rows as Evidence[];
};

export const deleteEvidence = async (id: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM evidence WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const updateEvidenceDescription = async (
  id: number,
  description: string | null,
): Promise<Evidence | null> => {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE evidence SET description = ? WHERE id = ?',
    [description, id],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findEvidenceById(id);
};