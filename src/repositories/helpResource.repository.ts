/**
 * @file helpResource.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "help_resources" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export type HelpResourceType = 'emergency_line' | 'support_center' | 'shelter';

export interface HelpResource {
  id: number;
  name: string;
  type: HelpResourceType;
  abuse_type_id: number | null;
  location_id: number | null;
  address: string | null;
  phone: string | null;
  schedule: string | null;
  city: string | null;
  department: string | null;
}

export const findAll = async (): Promise<HelpResource[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT hr.id, hr.name, hr.type, hr.abuse_type_id, hr.location_id,
            hr.address, hr.phone, hr.schedule, l.city, l.department
     FROM help_resources hr
     LEFT JOIN locations l ON l.id = hr.location_id
     WHERE hr.active = TRUE
     ORDER BY hr.id`,
  );

  return rows as HelpResource[];
};