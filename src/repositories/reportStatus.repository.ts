/**
 * @file reportStatus.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "report_statuses" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface ReportStatus {
  id: number;
  name: string;
  sort_order: number;
}

export const findAll = async (): Promise<ReportStatus[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, sort_order FROM report_statuses ORDER BY sort_order, id',
  );

  return rows as ReportStatus[];
};