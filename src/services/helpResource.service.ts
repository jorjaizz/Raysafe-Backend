/**
 * @file helpResource.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "help_resources". Orquesta
 *               las operaciones del repositorio. No conoce MySQL ni HTTP.
 */
import * as helpResourceRepository from '../repositories/helpResource.repository';

export type { HelpResource, HelpResourceType } from '../repositories/helpResource.repository';

export const getAllHelpResources = () => helpResourceRepository.findAll();