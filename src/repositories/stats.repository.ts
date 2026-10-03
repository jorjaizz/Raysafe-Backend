/**
 * @file stats.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "estadísticas/dashboard".
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface DepartmentAbuseTypeCount {
  department: string;
  abuse_type_id: number;
  cantidad: number;
}

export const countAllReports = async (): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM reports');
  return Number(rows[0]?.total ?? 0);
};

export const countDepartments = async (): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(DISTINCT department) AS total FROM locations',
  );
  return Number(rows[0]?.total ?? 0);
};

export const listDepartments = async (): Promise<string[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT DISTINCT department FROM locations ORDER BY department',
  );
  return rows.map((row) => row.department as string);
};

export const departmentCountsByAbuseType = async (): Promise<DepartmentAbuseTypeCount[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.department, r.abuse_type_id, COUNT(*) AS cantidad
     FROM reports r
     INNER JOIN locations l ON l.id = r.location_id
     GROUP BY l.department, r.abuse_type_id
     ORDER BY l.department`,
  );

  return rows as DepartmentAbuseTypeCount[];
};