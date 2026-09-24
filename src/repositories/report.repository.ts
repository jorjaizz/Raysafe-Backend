/**
 * @file report.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "reports" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Report {
  id: number;
  public_id: string;
  token_hash: string;
  abuse_type_id: number;
  report_status_id: number;
  description: string;
  specific_address: string | null;
  location_id: number | null;
  institution_id: number | null;
  risk_level: RiskLevel | null;
  notification_email: string | null;
  agent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  public_id: string;
  token_hash: string;
  abuse_type_id: number;
  report_status_id: number;
  description: string;
  specific_address: string | null;
  location_id: number | null;
  institution_id: number;
  notification_email: string | null;
}

export interface TrackReport extends Report {
  status_name: string;
  abuse_type_name: string;
  abuse_type_category: 'human' | 'animal';
  institution_name: string | null;
  city: string | null;
  department: string | null;
}

export const findAbuseTypeById = async (
  id: number,
): Promise<{ id: number; category: 'human' | 'animal' } | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, category FROM abuse_types WHERE id = ?',
    [id],
  );

  return (rows[0] as { id: number; category: 'human' | 'animal' } | undefined) ?? null;
};

export const findStatusIdByName = async (name: string): Promise<number | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM report_statuses WHERE name = ?',
    [name],
  );

  return (rows[0]?.id as number | undefined) ?? null;
};

export const findInstitutionByCategory = async (
  category: 'human' | 'animal',
): Promise<number | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM institutions WHERE category = ? AND active = TRUE LIMIT 1',
    [category],
  );

  return (rows[0]?.id as number | undefined) ?? null;
};

export const locationExists = async (id: number): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM locations WHERE id = ? LIMIT 1',
    [id],
  );

  return rows.length > 0;
};

export const publicIdExists = async (publicId: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM reports WHERE public_id = ? LIMIT 1',
    [publicId],
  );

  return rows.length > 0;
};

export const insertReport = async (data: CreateReportInput): Promise<Report> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO reports (public_id, token_hash, abuse_type_id, report_status_id,
       description, specific_address, location_id, institution_id, risk_level,
       notification_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    [
      data.public_id,
      data.token_hash,
      data.abuse_type_id,
      data.report_status_id,
      data.description,
      data.specific_address,
      data.location_id,
      data.institution_id,
      data.notification_email,
    ],
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM reports WHERE id = ?',
    [result.insertId],
  );

  return rows[0] as Report;
};

export const findTrackByPublicId = async (publicId: string): Promise<TrackReport | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.public_id, r.token_hash, r.abuse_type_id, r.report_status_id,
            r.description, r.specific_address, r.location_id, r.institution_id,
            r.risk_level, r.notification_email, r.agent_id, r.created_at, r.updated_at,
            s.name AS status_name,
            a.name AS abuse_type_name, a.category AS abuse_type_category,
            l.city, l.department,
            i.name AS institution_name
     FROM reports r
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     LEFT JOIN locations l ON l.id = r.location_id
     LEFT JOIN institutions i ON i.id = r.institution_id
     WHERE r.public_id = ?`,
    [publicId],
  );

  return (rows[0] as TrackReport) ?? null;
};

export interface UpdateReporterFieldsInput {
  description?: string;
  specific_address?: string | null;
  location_id?: number | null;
  notification_email?: string | null;
}

export const updateReporterFields = async (
  publicId: string,
  data: UpdateReporterFieldsInput,
): Promise<boolean> => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }

  if (data.specific_address !== undefined) {
    fields.push('specific_address = ?');
    values.push(data.specific_address ?? null);
  }

  if (data.location_id !== undefined) {
    fields.push('location_id = ?');
    values.push(data.location_id ?? null);
  }

  if (data.notification_email !== undefined) {
    fields.push('notification_email = ?');
    values.push(data.notification_email ?? null);
  }

  if (fields.length === 0) {
    return false;
  }

  values.push(publicId);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE reports SET ${fields.join(', ')} WHERE public_id = ?`,
    values,
  );

  return result.affectedRows > 0;
};