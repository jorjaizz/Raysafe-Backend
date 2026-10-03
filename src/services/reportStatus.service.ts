/**
 * @file reportStatus.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "report_statuses". Orquesta
 *               las operaciones del repositorio. No conoce MySQL ni HTTP.
 */
import * as reportStatusRepository from '../repositories/reportStatus.repository';

export type { ReportStatus } from '../repositories/reportStatus.repository';

export const getReportStatuses = () => reportStatusRepository.findAll();