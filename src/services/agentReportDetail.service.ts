/**
 * @file agentReportDetail.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "detalle de reporte del agente":
 *               obtiene el detalle completo de una denuncia sin asignar,
 *               incluyendo evidencia. No conoce MySQL ni HTTP.
 */
import * as reportRepository from '../repositories/report.repository';
import { HttpError } from '../utils/HttpError';

export interface EvidenceItem {
  file_type: string | null;
  file_url: string;
  description: string | null;
  uploaded_at: string;
}

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

export interface AgentReportDetail {
  id: number;
  public_id: string;
  nivel_riesgo: string | null;
  tipo_abuso: string;
  fecha_creacion: string;
  ubicacion: string | null;
  direccion_especifica: string | null;
  descripcion: string;
  evidencia: EvidenceItem[];
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

export const getUnassignedReportDetail = async (
  id: number,
  institutionId: number,
): Promise<AgentReportDetail | null> => {
  const report = await reportRepository.findUnassignedById(id, institutionId);

  if (!report) {
    return null;
  }

  const evidence = await reportRepository.listEvidenceByReportId(id);

  const ubicacion =
    report.city && report.department
      ? `${report.city}, ${report.department}`
      : report.city ?? report.department ?? null;

  return {
    id: report.id,
    public_id: report.public_id,
    nivel_riesgo: report.risk_level,
    tipo_abuso: report.abuse_type_name,
    fecha_creacion: report.created_at,
    ubicacion,
    direccion_especifica: report.specific_address,
    descripcion: report.description,
    evidencia: evidence.map((e) => ({
      file_type: e.file_type,
      file_url: e.file_url,
      description: e.description,
      uploaded_at: e.uploaded_at,
    })),
  };
};