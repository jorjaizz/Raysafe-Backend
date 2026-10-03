/**
 * @file educationalGuide.repository.ts
 * @capa Repository (Acceso a datos)
 * @descripcion Consultas SQL del módulo "educational_guides" contra MySQL.
 *               Única capa que conoce la base de datos. No maneja HTTP
 *               ni lógica de negocio.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

export interface EducationalGuide {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  pdf_file_url: string;
}

export const findAll = async (): Promise<EducationalGuide[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, title, description, category, pdf_file_url FROM educational_guides ORDER BY id',
  );

  return rows as EducationalGuide[];
};