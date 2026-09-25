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