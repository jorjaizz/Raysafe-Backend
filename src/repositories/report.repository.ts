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

export interface UnassignedReportRow {
  id: number;
  public_id: string;
  abuse_type_name: string;
  location_id: number | null;
  status_name: string;
  created_at: string;
}

export interface AgentReportDetailRow {
  id: number;
  public_id: string;
  risk_level: RiskLevel | null;
  description: string;
  specific_address: string | null;
  created_at: string;
  abuse_type_name: string;
  city: string | null;
  department: string | null;
}

export interface EvidenceRow {
  id: number;
  file_type: string | null;
  file_url: string;
  description: string | null;
  uploaded_at: string;
}

const buildSearchConditions = (search: string | undefined): { clause: string; values: unknown[] } => {
  if (!search) {
    return { clause: '', values: [] };
  }

  return {
    clause:
      'AND (r.public_id LIKE ? OR a.name LIKE ? OR l.city LIKE ? OR l.department LIKE ?)',
    values: [search, search, search, search],
  };
};

export const countUnassignedByInstitution = async (
  institutionId: number,
  search?: string,
): Promise<number> => {
  const searchCond = buildSearchConditions(search);
  const values = [institutionId, ...searchCond.values];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.institution_id = ? AND r.agent_id IS NULL ${searchCond.clause}`,
    values,
  );

  return Number(rows[0]?.total ?? 0);
};

export const findUnassignedByInstitution = async (
  institutionId: number,
  search: string | undefined,
  offset: number,
  limit: number,
): Promise<UnassignedReportRow[]> => {
  const searchCond = buildSearchConditions(search);
  const values = [institutionId, ...searchCond.values, limit, offset];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id,
            r.public_id,
            a.name AS abuse_type_name,
            r.location_id,
            s.name AS status_name,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.institution_id = ? AND r.agent_id IS NULL ${searchCond.clause}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  return rows as UnassignedReportRow[];
};

export const findUnassignedById = async (
  id: number,
  institutionId: number,
): Promise<AgentReportDetailRow | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id,
            r.public_id,
            r.risk_level,
            r.description,
            r.specific_address,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            a.name AS abuse_type_name,
            l.city,
            l.department
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.id = ? AND r.institution_id = ? AND r.agent_id IS NULL`,
    [id, institutionId],
  );

  return (rows[0] as AgentReportDetailRow) ?? null;
};

export const findReportByIdForAgent = async (
  id: number,
  institutionId: number,
): Promise<AgentReportDetailRow | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id,
            r.public_id,
            r.risk_level,
            r.description,
            r.specific_address,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            a.name AS abuse_type_name,
            l.city,
            l.department
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.id = ? AND r.institution_id = ?`,
    [id, institutionId],
  );

  return (rows[0] as AgentReportDetailRow) ?? null;
};

export const listEvidenceByReportId = async (reportId: number): Promise<EvidenceRow[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, file_type, file_url, description,
            DATE_FORMAT(uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at
     FROM evidence
     WHERE report_id = ?
     ORDER BY id`,
    [reportId],
  );

  return rows as EvidenceRow[];
};

export interface AssignReportResult {
  id: number;
  public_id: string;
  risk_level: RiskLevel;
  report_status_id: number;
  agent_id: number;
}

export const assignToAgentWithRisk = async (
  reportId: number,
  agentId: number,
  institutionId: number,
  riskLevel: RiskLevel,
): Promise<AssignReportResult | null> => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [updateResult] = await conn.query<ResultSetHeader>(
      `UPDATE reports
       SET agent_id = ?, report_status_id = 2, risk_level = ?
       WHERE id = ? AND institution_id = ? AND agent_id IS NULL AND report_status_id = 1`,
      [agentId, riskLevel, reportId, institutionId],
    );

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      return null;
    }

    await conn.query(
      `INSERT INTO status_history (report_id, previous_status_id, new_status_id, agent_id, comment)
       VALUES (?, 1, 2, ?, 'Agente tomó la denuncia')`,
      [reportId, agentId],
    );

    const [agentRows] = await conn.query<RowDataPacket[]>(
      'SELECT name FROM users WHERE id = ?',
      [agentId],
    );
    const agentName = agentRows[0]?.name ?? 'Agente';

    await conn.query(
      `INSERT INTO internal_notes (report_id, agent_id, content)
       VALUES (?, ?, ?)`,
      [reportId, agentId, `Denuncia tomada por agente ${agentName}`],
    );

    await conn.commit();

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id, public_id, risk_level, report_status_id, agent_id
       FROM reports WHERE id = ?`,
      [reportId],
    );

    return rows[0] as AssignReportResult;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};