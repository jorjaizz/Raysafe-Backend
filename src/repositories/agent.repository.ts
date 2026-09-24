/**
 * @file agent.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "administración de agentes" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { HttpError } from '../utils/HttpError';

export interface AgentListRow {
  id: number;
  name: string;
  email: string;
  active: number;
  assigned_cases: number;
}

export interface AgentDetailRow {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  institution_id: number;
  active: number;
  created_at: string;
}

export interface ListAgentsFilters {
  institutionId: number;
  search?: string;
  active?: boolean;
}

export interface UpdateAgentInput {
  roleId?: number;
  active?: boolean;
}

export interface CreateAgentInput {
  name: string;
  email: string;
  passwordHash: string;
  role_id: number;
  institution_id: number;
}

const ROLE_TO_DB_NAME: Record<string, string> = {
  agent: 'agente',
  admin: 'admin',
};

// Traduce el valor del radio del frontend ("agent"/"admin") al nombre real
// de la tabla roles ('agente'/'admin'). Resistente a como este sembrada la BD.
export const roleNameFromFrontend = (role: string): string | null =>
  ROLE_TO_DB_NAME[role] ?? null;

export const findRoleIdByName = async (name: string): Promise<number | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM roles WHERE name = ?',
    [name],
  );

  return (rows[0]?.id as number | undefined) ?? null;
};

export const emailExists = async (email: string): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  return rows.length > 0;
};

export const insertAgent = async (data: CreateAgentInput): Promise<number> => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, password, role_id, institution_id)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.email, data.passwordHash, data.role_id, data.institution_id],
    );

    return result.insertId;
  } catch (error) {
    // El email es UNIQUE en la tabla: si dos peticiónes entran a la vez, el
    // pre-check no alcanza y la BD corta el pleito con un ER_DUP_ENTRY.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'ER_DUP_ENTRY'
    ) {
      throw new HttpError(409, 'El email ya está registrado');
    }

    throw error;
  }
};

export const countByInstitution = async (
  filters: ListAgentsFilters,
): Promise<number> => {
  const conditions = ['institution_id = ?'];
  const values: unknown[] = [filters.institutionId];

  if (filters.search) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term);
  }

  if (filters.active !== undefined) {
    conditions.push('active = ?');
    values.push(filters.active);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users WHERE ${conditions.join(' AND ')}`,
    values,
  );

  return Number(rows[0]?.total ?? 0);
};

export const listByInstitution = async (
  filters: ListAgentsFilters,
  offset: number,
  limit: number,
): Promise<AgentListRow[]> => {
  const conditions = ['u.institution_id = ?'];
  const values: unknown[] = [filters.institutionId];

  if (filters.search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term);
  }

  if (filters.active !== undefined) {
    conditions.push('u.active = ?');
    values.push(filters.active);
  }

  values.push(limit, offset);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, u.active, COUNT(r.id) AS assigned_cases
     FROM users u
     LEFT JOIN reports r ON r.agent_id = u.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY u.id
     ORDER BY u.id
     LIMIT ? OFFSET ?`,
    values,
  );

  return rows as AgentListRow[];
};

export const findAgentById = async (
  id: number,
  institutionId: number,
): Promise<AgentDetailRow | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, u.role_id, r.name AS role_name,
            u.institution_id, u.active,
            DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.institution_id = ?`,
    [id, institutionId],
  );

  return (rows[0] as AgentDetailRow) ?? null;
};

export const roleExists = async (roleId: number): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM roles WHERE id = ?',
    [roleId],
  );

  return rows.length > 0;
};

export const updateAgent = async (
  id: number,
  institutionId: number,
  data: UpdateAgentInput,
): Promise<boolean> => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.roleId !== undefined) {
    fields.push('role_id = ?');
    values.push(data.roleId);
  }

  if (data.active !== undefined) {
    fields.push('active = ?');
    values.push(data.active);
  }

  if (fields.length === 0) {
    return false;
  }

  values.push(id, institutionId);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND institution_id = ?`,
    values,
  );

  return result.affectedRows > 0;
};