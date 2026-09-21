/**
 * @file location.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "locations". Orquesta las
 *               operaciones del repositorio. No conoce MySQL ni HTTP.
 */
import * as locationRepository from '../repositories/location.repository';

export type { Location } from '../repositories/location.repository';

export const getDepartments = () => locationRepository.listDepartments();

export const getCitiesByDepartment = (department: string) =>
  locationRepository.listCitiesByDepartment(department);