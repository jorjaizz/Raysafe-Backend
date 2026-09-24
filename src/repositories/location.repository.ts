/**
 * @file location.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "locations" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface Location {
  id: number;
  city: string;
  department: string;
}

export const listDepartments = async (): Promise<string[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT DISTINCT department FROM locations ORDER BY department',
  );

  return rows.map((row) => row.department as string);
};

export const listCitiesByDepartment = async (department: string): Promise<Location[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, city, department FROM locations WHERE department = ? ORDER BY city',
    [department],
  );

  return rows as Location[];
};