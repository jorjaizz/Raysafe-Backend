/**
 * @file adminReport.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del modulo "registros de denuncias" del panel admin.
 *               Unica capa que conoce la base de datos. No maneja HTTP
 *               ni logica de negocio.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface ReportLogRow {
  id: number;
  public_id: string;
  created_at: string;
  abuse_type_name: string;
  agent_name: string | null;
  agent_email: string | null;
  city: string | null;
  department: string | null;
  status_name: string;
  risk_level: string | null;
}

export interface ReportDetailRow {
  id: number;
  public_id: string;
  description: string;
  specific_address: string | null;
  risk_level: string | null;
  notification_email: string | null;
  created_at: string;
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

const buildSearchConditions = (search: string | undefined): { clause: string; values: unknown[] } => {
  if (!search) {
    return { clause: '', values: [] };
  }

  return {
    clause:
      'AND (r.public_id LIKE ? OR u.name LIKE ? OR a.name LIKE ? OR l.city LIKE ? OR l.department LIKE ?)',
    values: [search, search, search, search, search],
  };
};

export const countByInstitution = async (
  institutionId: number,
  search?: string,
): Promise<number> => {
  const searchCond = buildSearchConditions(search);
  const values = [institutionId, ...searchCond.values];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN users u ON u.id = r.agent_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.institution_id = ? AND r.agent_id IS NOT NULL ${searchCond.clause}`,
    values,
  );

  return Number(rows[0]?.total ?? 0);
};

export const listByInstitution = async (
  institutionId: number,
  search: string | undefined,
  offset: number,
  limit: number,
): Promise<ReportLogRow[]> => {
  const searchCond = buildSearchConditions(search);
  const values = [institutionId, ...searchCond.values, limit, offset];

  // left join users pa cuando el reporte no tiene agente asignado.
  // osea, agarra igual sin necesidad de agente.
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.public_id,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            a.name AS abuse_type_name,
            u.name AS agent_name, u.email AS agent_email,
            l.city, l.department,
            s.name AS status_name, r.risk_level
     FROM reports r
     INNER JOIN abuse_types a ON a.id = r.abuse_type_id
     INNER JOIN report_statuses s ON s.id = r.report_status_id
     LEFT JOIN users u ON u.id = r.agent_id
     LEFT JOIN locations l ON l.id = r.location_id
     WHERE r.institution_id = ? AND r.agent_id IS NOT NULL ${searchCond.clause}
     ORDER BY r.id DESC
     LIMIT ? OFFSET ?`,
    values,
  );

  // y aca la joda de la paginacion: limit y offset hacen el truco.
  // aura. pagina 3 de a 10 = brinca 20 y trae 10. facil p
  return rows as ReportLogRow[];
};

export const findReportById = async (
  id: number,
  institutionId: number,
): Promise<ReportDetailRow | null> => {
  // regla de oro, tipo cierre de puerta: nadie ve lo que no es de su institucion
  // el where lleva el institution_id pa que no se vea un reporte de otra institucion
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.public_id, r.description, r.specific_address, r.risk_level,
            r.notification_email,
            DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
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
     WHERE r.id = ? AND r.institution_id = ?`,
    [id, institutionId],
  );

  return (rows[0] as ReportDetailRow) ?? null;
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
            u.name AS agent_name
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