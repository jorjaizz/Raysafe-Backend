/**
 * @file abuseType.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "abuse_types". Orquesta las
 *               operaciones del repositorio. No conoce MySQL ni HTTP.
 */
import * as abuseTypeRepository from '../repositories/abuseType.repository';

export type { AbuseType, AbuseTypeInput } from '../repositories/abuseType.repository';

export const getAllAbuseTypes = (category?: 'human' | 'animal') =>
  abuseTypeRepository.findAll(category);

export const getAbuseTypeById = (id: number) => abuseTypeRepository.findById(id);

export const createAbuseType = (data: abuseTypeRepository.AbuseTypeInput) =>
  abuseTypeRepository.insert(data);

export const updateAbuseType = (id: number, data: abuseTypeRepository.AbuseTypeInput) =>
  abuseTypeRepository.update(id, data);

export const deleteAbuseType = (id: number) => abuseTypeRepository.remove(id);