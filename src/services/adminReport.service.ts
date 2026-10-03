/**
 * @file adminReport.service.ts
 * @capa Service (Logica de negocio)
 * @descripcion Logica de negocio del modulo "registros de denuncias" del panel
 *               admin: paginacion, mapeo a DTO y aislamiento por institucion.
 *               No conoce MySQL ni HTTP.
 */
import * as adminReportRepository from '../repositories/adminReport.repository';

export interface ReportLogItem {
  id: number;
  publicId: string;
  abuseType: string;
  agentName: string | null;
  createdAt: string;
  city: string | null;
  department: string | null;
  status: string;
  riskLevel: string | null;
}

export interface ReportLogResult {
  total: number;
  page: number;
  totalPages: number;
  data: ReportLogItem[];
}

export interface ReportDetail {
  id: number;
  publicId: string;
  description: string;
  specificAddress: string | null;
  riskLevel: string | null;
  createdAt: string;
  abuseType: { id: number; name: string; category: string };
  status: { id: number; name: string };
  location: { city: string; department: string } | null;
  agent: { id: number; name: string; email: string; active: boolean } | null;
  evidence: {
    id: number;
    fileType: string | null;
    fileUrl: string;
    description: string | null;
    uploadedAt: string;
  }[];
  notes: { id: number; content: string; agentName: string; createdAt: string }[];
  statusHistory: {
    id: number;
    previousStatusName: string | null;
    newStatusName: string;
    agentName: string | null;
    comment: string | null;
    date: string;
  }[];
}

export const listReportLogs = async (params: {
  institutionId: number;
  page: number;
  limit: number;
  search?: string;
}): Promise<ReportLogResult> => {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));
  const offset = (page - 1) * limit;
  const search = params.search?.trim() || undefined;

  // el search va igualito a las dos queries (count y list) o sino el total no va a cuadrar
  const [total, rows] = await Promise.all([
    adminReportRepository.countByInstitution(params.institutionId, search),
    adminReportRepository.listByInstitution(params.institutionId, search, offset, limit),
  ]);

  const data: ReportLogItem[] = rows.map((row) => ({
    id: row.id,
    publicId: row.public_id,
    abuseType: row.abuse_type_name,
    agentName: row.agent_name,
    createdAt: row.created_at,
    city: row.city,
    department: row.department,
    status: row.status_name,
    riskLevel: row.risk_level,
  }));

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit) || 0,
    data,
  };
};

export const getReportDetail = async (
  id: number,
  institutionId: number,
): Promise<ReportDetail | null> => {
  const row = await adminReportRepository.findReportById(id, institutionId);

  if (!row) {
    return null;
  }

  // lel expediente se trae de a tres queries aparte:
  // evidencia, notas internas y el historial de cambios de estado.
  const [evidence, notes, statusHistory] = await Promise.all([
    adminReportRepository.listEvidenceByReportId(id),
    adminReportRepository.listNotesByReportId(id),
    adminReportRepository.listStatusHistoryByReportId(id),
  ]);

  return {
    id: row.id,
    publicId: row.public_id,
    description: row.description,
    specificAddress: row.specific_address,
    riskLevel: row.risk_level,
    createdAt: row.created_at,
    abuseType: {
      id: row.abuse_type_id,
      name: row.abuse_type_name,
      category: row.abuse_type_category,
    },
    status: {
      id: row.report_status_id,
      name: row.status_name,
    },
    location:
      row.city !== null || row.department !== null
        ? { city: row.city ?? '', department: row.department ?? '' }
        : null,
    agent:
      row.agent_id !== null
        ? {
            id: row.agent_id,
            name: row.agent_name ?? '',
            email: row.agent_email ?? '',
            active: Boolean(row.agent_active),
          }
        : null,
    evidence: evidence.map((e) => ({
      id: e.id,
      fileType: e.file_type,
      fileUrl: e.file_url,
      description: e.description,
      uploadedAt: e.uploaded_at,
    })),
    notes: notes.map((n) => ({
      id: n.id,
      content: n.content,
      agentName: n.agent_name,
      createdAt: n.created_at,
    })),
    statusHistory: statusHistory.map((h) => ({
      id: h.id,
      previousStatusName: h.previous_status_name,
      newStatusName: h.new_status_name,
      agentName: h.agent_name,
      comment: h.comment,
      date: h.date,
    })),
  };
};