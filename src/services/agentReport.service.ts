/**
 * @file agentReport.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "denuncias del agente":
 *               listado y detalle de las denuncias asignadas al agente,
 *               inserción de notas internas y cambio de estado (con reglas
 *               de transición). No conoce MySQL ni HTTP.
 */
import * as agentReportRepository from '../repositories/agentReport.repository';
import { HttpError } from '../utils/HttpError';

export interface AgentReportListItem {
  id: number;
  publicId: string;
  abuseType: string;
  createdAt: string;
  city: string | null;
  department: string | null;
  status: string;
  riskLevel: string | null;
}

export interface AgentReportDetail {
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

export interface CreatedNote {
  id: number;
  report_id: number;
  content: string;
  created_at: string;
  agent: { id: number; name: string };
}

const FINAL_STATUS_NAMES = ['Resuelta', 'Desestimada'];

const buildSearch = (search: unknown): string | undefined =>
  typeof search === 'string' && search.trim() !== '' ? search.trim() : undefined;

export const listMyReports = async (params: {
  agentId: number;
  page: number;
  limit: number;
  search?: string;
}): Promise<{ total: number; page: number; totalPages: number; data: AgentReportListItem[] }> => {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));
  const offset = (page - 1) * limit;
  const search = buildSearch(params.search);

  const [total, rows] = await Promise.all([
    agentReportRepository.countByAgent(params.agentId, search),
    agentReportRepository.listByAgent(params.agentId, search, offset, limit),
  ]);

  const data: AgentReportListItem[] = rows.map((row) => ({
    id: row.id,
    publicId: row.public_id,
    abuseType: row.abuse_type_name,
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

export const getMyReportDetail = async (
  id: number,
  agentId: number,
): Promise<AgentReportDetail | null> => {
  const row = await agentReportRepository.findReportById(id, agentId);

  if (!row) {
    return null;
  }

  const [evidence, notes, statusHistory] = await Promise.all([
    agentReportRepository.listEvidenceByReportId(id),
    agentReportRepository.listNotesByReportId(id),
    agentReportRepository.listStatusHistoryByReportId(id),
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

const ensureOwnedByAgent = async (
  reportId: number,
  agentId: number,
): Promise<void> => {
  const report = await agentReportRepository.findReportAgentId(reportId);

  if (!report) {
    throw new HttpError(404, 'Denuncia no encontrada');
  }

  if (report.agent_id !== agentId) {
    throw new HttpError(403, 'Esta denuncia no está asignada a tu cuenta');
  }
};

export const addNote = async (
  reportId: number,
  agentId: number,
  content: string,
): Promise<CreatedNote> => {
  await ensureOwnedByAgent(reportId, agentId);

  const note = await agentReportRepository.insertNote(reportId, agentId, content);

  return {
    id: note.id,
    report_id: reportId,
    content: note.content,
    created_at: note.created_at,
    agent: { id: note.agent_id, name: note.agent_name },
  };
};

export const updateReportStatus = async (
  reportId: number,
  agentId: number,
  data: { status_id: number; comment?: string },
): Promise<AgentReportDetail> => {
  await ensureOwnedByAgent(reportId, agentId);

  const status = await agentReportRepository.findStatusById(data.status_id);

  if (!status) {
    throw new HttpError(400, 'El estado indicado no existe');
  }

  const current = await agentReportRepository.findReportById(reportId, agentId);

  if (!current) {
    throw new HttpError(404, 'Denuncia no encontrada');
  }

  if (current.report_status_id === status.id) {
    throw new HttpError(400, `La denuncia ya se encuentra en "${current.status_name}"`);
  }

  if (FINAL_STATUS_NAMES.includes(current.status_name)) {
    throw new HttpError(
      409,
      `La denuncia ya se encuentra en un estado final ("${current.status_name}") y no se puede modificar`,
    );
  }

  await agentReportRepository.updateStatus({
    reportId,
    previousStatusId: current.report_status_id,
    newStatusId: status.id,
    agentId,
    comment: data.comment?.trim() || null,
  });

  const detail = await getMyReportDetail(reportId, agentId);

  if (!detail) {
    throw new HttpError(404, 'Denuncia no encontrada');
  }

  return detail;
};