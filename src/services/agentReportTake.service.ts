/**
 * @file agentReportTake.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio para que un agente tome una denuncia sin asignar:
 *               asigna agente, cambia estado a "En Investigación", establece risk_level,
 *               registra historial y crea nota interna. No conoce MySQL ni HTTP.
 */
import * as reportRepository from '../repositories/report.repository';
import { HttpError } from '../utils/HttpError';

export interface TakenReportDetail {
  id: number;
  public_id: string;
  nivel_riesgo: string;
  tipo_abuso: string;
  estado: string;
  agente_asignado: { id: number; name: string };
  fecha_asignacion: string;
}

export const takeUnassignedReport = async (
  reportId: number,
  agentId: number,
  institutionId: number,
  riskLevel: reportRepository.RiskLevel,
): Promise<TakenReportDetail | null> => {
  const assigned = await reportRepository.assignToAgentWithRisk(
    reportId,
    agentId,
    institutionId,
    riskLevel,
  );

  if (!assigned) {
    return null;
  }

  const detailRows = await reportRepository.findReportByIdForAgent(reportId, institutionId);

  if (!detailRows) {
    return null;
  }

  return {
    id: assigned.id,
    public_id: assigned.public_id,
    nivel_riesgo: assigned.risk_level,
    tipo_abuso: detailRows.abuse_type_name,
    estado: 'En Investigación',
    agente_asignado: { id: agentId, name: '' },
    fecha_asignacion: new Date().toISOString(),
  };
};