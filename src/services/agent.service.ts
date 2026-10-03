/**
 * @file agent.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "administración de agentes":
 *               creación, paginación, mapeo a DTO (sin exponer el hash de la
 *               contraseña) y aislamiento por institución.
 *               No conoce MySQL ni HTTP.
 */
import * as agentRepository from '../repositories/agent.repository';
import { HttpError } from '../utils/HttpError';
import bcrypt from 'bcryptjs';

export interface AgentListItem {
  id: number;
  name: string;
  email: string;
  assignedCases: number;
  active: boolean;
}

export interface AgentDetail {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  active: boolean;
  createdAt: string;
}

export interface ListAgentsParams {
  institutionId: number;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}

export interface AgentListResult {
  total: number;
  page: number;
  totalPages: number;
  data: AgentListItem[];
}

export const listAgents = async (params: ListAgentsParams): Promise<AgentListResult> => {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));
  const offset = (page - 1) * limit;

  const filters: agentRepository.ListAgentsFilters = {
    institutionId: params.institutionId,
    search: params.search?.trim() || undefined,
    active: params.active,
  };

  const [total, rows] = await Promise.all([
    agentRepository.countByInstitution(filters),
    agentRepository.listByInstitution(filters, offset, limit),
  ]);

  const data: AgentListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    assignedCases: Number(row.assigned_cases ?? 0),
    active: Boolean(row.active),
  }));

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit) || 0,
    data,
  };
};

export const getAgentDetail = async (
  id: number,
  institutionId: number,
): Promise<AgentDetail | null> => {
  const row = await agentRepository.findAgentById(id, institutionId);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roleId: row.role_id,
    roleName: row.role_name,
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
};

export const createAgent = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  institutionId: number;
}): Promise<AgentDetail> => {
  const roleName = agentRepository.roleNameFromFrontend(data.role);

  if (!roleName) {
    throw new HttpError(400, 'El rol indicado no existe');
  }

  const roleId = await agentRepository.findRoleIdByName(roleName);

  if (!roleId) {
    throw new HttpError(400, 'El rol indicado no existe');
  }

  if (await agentRepository.emailExists(data.email)) {
    throw new HttpError(409, 'El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const agentId = await agentRepository.insertAgent({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role_id: roleId,
    institution_id: data.institutionId,
  });

  const detail = await getAgentDetail(agentId, data.institutionId);

  if (!detail) {
    throw new HttpError(500, 'No se pudo recuperar el agente creado');
  }

  return detail;
};

export const updateAgent = async (
  id: number,
  institutionId: number,
  data: agentRepository.UpdateAgentInput,
): Promise<AgentDetail> => {
  const existing = await agentRepository.findAgentById(id, institutionId);

  if (!existing) {
    throw new HttpError(404, 'Agente no encontrado');
  }

  if (data.roleId === undefined && data.active === undefined) {
    throw new HttpError(400, 'Debes enviar al menos un campo a modificar');
  }

  if (data.roleId !== undefined && !(await agentRepository.roleExists(data.roleId))) {
    throw new HttpError(400, 'El rol indicado no existe');
  }

  await agentRepository.updateAgent(id, institutionId, data);

  const detail = await getAgentDetail(id, institutionId);

  if (!detail) {
    throw new HttpError(404, 'Agente no encontrado');
  }

  return detail;
};