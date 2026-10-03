/**
 * @file agentReport.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "denuncias del agente" contra MySQL:
 *               listado/detalle de las denuncias asignadas, inserción de notas
 *               internas y cambio de estado (con transacción). Única capa que
 *               conoce la base de datos. No maneja HTTP ni lógica de negocio.
 */
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface AgentReportListRow {
  id: number;
  public_id: string;
  created_at: string;
  abuse_type_name: string;
  city: string | null;
  department: string | null;
  status_name: string;
  risk_level: string | null;
}

export interface AgentReportDetailRow {
  id: number;
  public_id: string;
  description: string;
  specific_address: string | null;
  risk_level: string | null;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
  abuse_type_id: number;
  abuse_type_name: string;
  abuse_type_category: string;
  report_status_id: number;
  status_name: string;
  location_id: number | null;
  city: string | null;
  department: string | null;
  agent_id: number | null;
  agent_name: string | null;
  agent_email: string | null;
  agent_active: number | null;
  institution_name: string | null;
}

export interface EvidenceRow {
  id: number;
  file_type: string | null;
  file_url: string;
  description: string | null;
  uploaded_at: string;
}

export interface NoteRow {
  id: number;
  content: string;
  created_at: string;
  agent_id: number;
  agent_name: string;
}

export interface StatusHistoryRow {
  id: number;
  previous_status_name: string | null;
  new_status_name: string;
  agent_name: string | null;
  comment: string | null;
  date: string;
}

export interface ReportStatus {
  id: number;
  name: string;
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

export const countByAgent = async (
  agentId: number,
  search?: string,
): Promise<number> => {
  const searchCond = buildSearchConditions(search);
  const values = [agentId, ...searchCond.values];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.agent_id = ? ${searchCond.clause}`,
    values,
  );

  return Number(rows[0]?.total ?? 0);
};

export const listByAgent = async (
  agentId: number,
  search: string | undefined,
  offset: number,
  limit: number,
): Promise<AgentReportListRow[]> => {
  const searchCond = buildSearchConditions(search);
  const values = [agentId, ...searchCond.values, limit, offset];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.public_id,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            a.name AS abuse_type_name,
            l.city, l.department,
            s.name AS status_name, r.risk_level
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.agent_id = ? ${searchCond.clause}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  return rows as AgentReportListRow[];
};

export const findReportById = async (
  id: number,
  agentId: number,
): Promise<AgentReportDetailRow | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.public_id, r.description, r.specific_address, r.risk_level,
            r.notification_email,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            DATE_FORMAT(r.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
            r.abuse_type_id, a.name AS abuse_type_name, a.category AS abuse_type_category,
            r.report_status_id, s.name AS status_name,
            r.location_id, l.city, l.department,
            r.agent_id, u.name AS agent_name, u.email AS agent_email, u.active AS agent_active,
            i.name AS institution_name
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN users u ON u.id = r.agent_id
     LEFT JOIN locations l ON l.id = r.location_id
     LEFT JOIN institutions i ON i.id = r.institution_id
     WHERE r.id = ? AND r.agent_id = ?`,
    [id, agentId],
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

export const listNotesByReportId = async (reportId: number): Promise<NoteRow[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT n.id, n.content,
            DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            u.id AS agent_id, u.name AS agent_name
     FROM internal_notes n
     INNER JOIN users u ON u.id = n.agent_id
     WHERE n.report_id = ?
     ORDER BY n.created_at DESC`,
    [reportId],
  );

  return rows as NoteRow[];
};

export const listStatusHistoryByReportId = async (reportId: number): Promise<StatusHistoryRow[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT h.id, h.comment,
            DATE_FORMAT(h.date, '%Y-%m-%d %H:%i:%s') AS date,
            ps.name AS previous_status_name,
            ns.name AS new_status_name,
            u.name AS agent_name
     FROM status_history h
     LEFT JOIN report_statuses ps ON ps.id = h.previous_status_id
     INNER JOIN report_statuses ns ON ns.id = h.new_status_id
     LEFT JOIN users u ON u.id = h.agent_id
     WHERE h.report_id = ?
     ORDER BY h.date DESC`,
    [reportId],
  );

  return rows as StatusHistoryRow[];
};

export const findReportAgentId = async (
  id: number,
): Promise<{ agent_id: number | null } | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT agent_id FROM reports WHERE id = ?',
    [id],
  );

  return (rows[0] as { agent_id: number | null } | undefined) ?? null;
};

export const insertNote = async (
  reportId: number,
  agentId: number,
  content: string,
): Promise<NoteRow> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO internal_notes (report_id, agent_id, content)
     VALUES (?, ?, ?)`,
    [reportId, agentId, content],
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT n.id, n.content,
            DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            u.id AS agent_id, u.name AS agent_name
     FROM internal_notes n
     INNER JOIN users u ON u.id = n.agent_id
     WHERE n.id = ?`,
    [result.insertId],
  );

  return rows[0] as NoteRow;
};

export const findStatusById = async (id: number): Promise<ReportStatus | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name FROM report_statuses WHERE id = ?',
    [id],
  );

  return (rows[0] as ReportStatus) ?? null;
};

export const updateStatus = async (data: {
  reportId: number;
  previousStatusId: number;
  newStatusId: number;
  agentId: number;
  comment: string | null;
}): Promise<boolean> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query<ResultSetHeader>(
      'UPDATE reports SET report_status_id = ? WHERE id = ?',
      [data.newStatusId, data.reportId],
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await connection.query(
      `INSERT INTO status_history (report_id, previous_status_id, new_status_id, agent_id, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [data.reportId, data.previousStatusId, data.newStatusId, data.agentId, data.comment],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};