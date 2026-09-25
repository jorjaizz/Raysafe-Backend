/**
 * @file agentReport.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "reportes del agente":
 *               listado paginado de denuncias sin asignar, filtrado por institución.
 *               No conoce MySQL ni HTTP.
 */
import * as reportRepository from '../repositories/report.repository';
import { HttpError } from '../utils/HttpError';

export interface UnassignedReportItem {
  id: number;
  public_id: string;
  abuse_type: string;
  ubicacion: number | null;
  estado: string;
  created_at: string;
}

export interface ListUnassignedParams {
  institutionId: number;
  page: number;
  limit: number;
  search?: string;
}

export interface UnassignedResult {
  total: number;
  page: number;
  totalPages: number;
  data: UnassignedReportItem[];
}

export const listUnassignedReports = async (params: ListUnassignedParams): Promise<UnassignedResult> => {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));
  const offset = (page - 1) * limit;
  const search = params.search?.trim() || undefined;

  const [total, rows] = await Promise.all([
    reportRepository.countUnassignedByInstitution(params.institutionId, search),
    reportRepository.findUnassignedByInstitution(params.institutionId, search, offset, limit),
  ]);

  const data: UnassignedReportItem[] = rows.map((row) => ({
    id: row.id,
    public_id: row.public_id,
    abuse_type: row.abuse_type_name,
    ubicacion: row.location_id,
    estado: row.status_name,
    created_at: row.created_at,
  }));

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit) || 0,
    data,
  };
};