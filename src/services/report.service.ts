/**
 * @file report.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "reports". Orquesta las
 *               operaciones del repositorio y genera los identificadores
 *               únicos (public_id y token de seguimiento). No conoce MySQL ni HTTP.
 */
import crypto from 'node:crypto';
import { HttpError } from '../utils/HttpError';
import { fileTypeFromMimetype, fileUrlFor, removeStoredFile } from '../config/uploads';
import * as reportRepository from '../repositories/report.repository';
import * as evidenceRepository from '../repositories/evidence.repository';

export interface CreateReportParams {
  abuse_type_id: number;
  description: string;
  specific_address?: string;
  location_id?: number;
  notification_email?: string;
}

export interface UpdateReporterParams {
  description?: string;
  specific_address?: string | null;
  location_id?: number | null;
  notification_email?: string | null;
}

const PUBLIC_ID_PREFIX = 'DN';
const PUBLIC_ID_BLOCK_LENGTH = 4;
const TRACKING_TOKEN_BYTES = 24;
const INITIAL_STATUS_NAME = 'Recibida';
const MAX_PUBLIC_ID_ATTEMPTS = 10;

const generatePublicId = (): string => {
  const block = () =>
    crypto
      .randomInt(0, 10000)
      .toString()
      .padStart(PUBLIC_ID_BLOCK_LENGTH, '0');

  return `${PUBLIC_ID_PREFIX}-${block()}-${block()}`;
};

const generatePublicIdUnique = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    const candidate = generatePublicId();

    if (!(await reportRepository.publicIdExists(candidate))) {
      return candidate;
    }
  }

  throw new HttpError(500, 'No se pudo generar un ID público único');
};

const generateTrackingToken = (): { rawToken: string; tokenHash: string } => {
  const rawToken = crypto.randomBytes(TRACKING_TOKEN_BYTES).toString('hex');

  return {
    rawToken,
    tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
  };
};

const verifyTrackingToken = (token: string, tokenHash: string): boolean => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return hash === tokenHash;
};

const toBasicView = (report: reportRepository.TrackReport) => ({
  public_id: report.public_id,
  report_status_id: report.report_status_id,
  status_name: report.status_name,
  abuse_type_name: report.abuse_type_name,
  abuse_type_category: report.abuse_type_category,
  created_at: report.created_at,
  updated_at: report.updated_at,
});

const toExplicitView = (report: reportRepository.TrackReport) => ({
  public_id: report.public_id,
  report_status_id: report.report_status_id,
  status_name: report.status_name,
  abuse_type_id: report.abuse_type_id,
  abuse_type_name: report.abuse_type_name,
  abuse_type_category: report.abuse_type_category,
  institution_id: report.institution_id,
  institution_name: report.institution_name,
  description: report.description,
  specific_address: report.specific_address,
  location_id: report.location_id,
  city: report.city,
  department: report.department,
  notification_email: report.notification_email,
  created_at: report.created_at,
  updated_at: report.updated_at,
});

export const getReportTrack = async (publicId: string, token?: string) => {
  const report = await reportRepository.findTrackByPublicId(publicId);

  if (!report) {
    throw new HttpError(404, 'Denuncia no encontrada');
  }

  if (!token) {
    return toBasicView(report);
  }

  if (!verifyTrackingToken(token, report.token_hash)) {
    throw new HttpError(403, 'Token inválido');
  }

  return toExplicitView(report);
};

export const updateReportByReporter = async (
  publicId: string,
  token: string,
  fields: UpdateReporterParams,
) => {
  const report = await reportRepository.findTrackByPublicId(publicId);

  if (!report) {
    throw new HttpError(404, 'Denuncia no encontrada');
  }

  if (!verifyTrackingToken(token, report.token_hash)) {
    throw new HttpError(403, 'Token inválido');
  }

  if (report.status_name !== INITIAL_STATUS_NAME) {
    throw new HttpError(
      409,
      `La denuncia ya no se puede modificar porque su estado es "${report.status_name}"`,
    );
  }

  if (
    fields.location_id !== undefined &&
    fields.location_id !== null &&
    !(await reportRepository.locationExists(fields.location_id))
  ) {
    throw new HttpError(400, 'La ubicación no existe');
  }

  await reportRepository.updateReporterFields(publicId, fields);

  const updated = await reportRepository.findTrackByPublicId(publicId);

  return toExplicitView(updated!);
};

export const createReport = async (data: CreateReportParams) => {
  const abuseType = await reportRepository.findAbuseTypeById(data.abuse_type_id);

  if (!abuseType) {
    throw new HttpError(400, 'El tipo de abuso no existe');
  }

  if (data.location_id !== undefined && !(await reportRepository.locationExists(data.location_id))) {
    throw new HttpError(400, 'La ubicación no existe');
  }

  const institutionId = await reportRepository.findInstitutionByCategory(abuseType.category);

  if (!institutionId) {
    throw new HttpError(500, 'No se encontró una institución para la categoría del abuso');
  }

  const statusId = await reportRepository.findStatusIdByName(INITIAL_STATUS_NAME);

  if (!statusId) {
    throw new HttpError(500, `No se encontró el estado inicial "${INITIAL_STATUS_NAME}"`);
  }

  const publicId = await generatePublicIdUnique();
  const { rawToken, tokenHash } = generateTrackingToken();

  const report = await reportRepository.insertReport({
    public_id: publicId,
    token_hash: tokenHash,
    abuse_type_id: data.abuse_type_id,
    report_status_id: statusId,
    description: data.description,
    specific_address: data.specific_address ?? null,
    location_id: data.location_id ?? null,
    institution_id: institutionId,
    notification_email: data.notification_email ?? null,
  });

  return {
    id: report.id,
    public_id: report.public_id,
    token: rawToken,
    abuse_type_id: report.abuse_type_id,
    report_status_id: report.report_status_id,
    institution_id: report.institution_id,
    description: report.description,
    specific_address: report.specific_address,
    location_id: report.location_id,
    risk_level: report.risk_level,
    notification_email: report.notification_email,
    created_at: report.created_at,
  };
};

export interface EvidenceFile {
  filename: string;
  mimetype: string;
}

const findReportWithToken = async (publicId: string, token: string) => {
  const report = await reportRepository.findTrackByPublicId(publicId);

  if (!report) {
    throw new HttpError(404, 'Denuncia no encontrada');
  }

  if (!token || !verifyTrackingToken(token, report.token_hash)) {
    throw new HttpError(403, 'Token inválido');
  }

  return report;
};

const toEvidenceView = (evidence: evidenceRepository.Evidence) => ({
  id: evidence.id,
  fileType: evidence.file_type,
  fileUrl: evidence.file_url,
  description: evidence.description,
  uploadedAt: evidence.uploaded_at,
});

export const addEvidence = async (
  publicId: string,
  token: string,
  file: EvidenceFile,
  description?: string,
) => {
  const report = await findReportWithToken(publicId, token);

  try {
    return await evidenceRepository.insertEvidence({
      report_id: report.id,
      file_type: fileTypeFromMimetype(file.mimetype),
      file_url: fileUrlFor(file.filename),
      description: description?.trim().slice(0, 250) || null,
    });
  } catch (error) {
    // Si el INSERT falla, no dejamos un archivo huérfano en el disco.
    await removeStoredFile(file.filename).catch(() => undefined);
    throw error;
  }
};

export const listEvidence = async (publicId: string, token: string) => {
  const report = await findReportWithToken(publicId, token);
  const rows = await evidenceRepository.listEvidenceByReportId(report.id);

  return rows.map(toEvidenceView);
};

export const deleteEvidenceById = async (
  publicId: string,
  token: string,
  evidenceId: number,
) => {
  const report = await findReportWithToken(publicId, token);

  const evidence = await evidenceRepository.findEvidenceById(evidenceId);

  if (!evidence || evidence.report_id !== report.id) {
    throw new HttpError(404, 'Evidencia no encontrada');
  }

  await evidenceRepository.deleteEvidence(evidence.id);

  // Solo borramos del disco si la evidencia es un archivo local; las
  // evidencias viejas apuntan a URLs externas y no tienen archivo que borrar.
  if (evidence.file_url.startsWith(fileUrlFor(''))) {
    const filename = evidence.file_url.slice(fileUrlFor('').length);
    await removeStoredFile(filename).catch(() => undefined);
  }
};

export const updateEvidenceDescription = async (
  publicId: string,
  token: string,
  evidenceId: number,
  description?: string,
) => {
  const report = await findReportWithToken(publicId, token);

  const evidence = await evidenceRepository.findEvidenceById(evidenceId);

  if (!evidence || evidence.report_id !== report.id) {
    throw new HttpError(404, 'Evidencia no encontrada');
  }

  const updated = await evidenceRepository.updateEvidenceDescription(
    evidence.id,
    description?.trim().slice(0, 250) || null,
  );

  if (!updated) {
    throw new HttpError(404, 'Evidencia no encontrada');
  }

  return toEvidenceView(updated);
};