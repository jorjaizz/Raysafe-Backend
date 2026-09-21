/**
 * @file educationalGuide.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "educational_guides". Orquesta
 *               las operaciones del repositorio. No conoce MySQL ni HTTP.
 */
import * as educationalGuideRepository from '../repositories/educationalGuide.repository';

export type { EducationalGuide } from '../repositories/educationalGuide.repository';

export const getAllEducationalGuides = () => educationalGuideRepository.findAll();