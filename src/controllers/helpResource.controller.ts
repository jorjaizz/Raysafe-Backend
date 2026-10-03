/**
 * @file helpResource.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as helpResourceService from '../services/helpResource.service';

// GET /api/help-resources
export const getHelpResources = async (_req: Request, res: Response) => {
  try {
    const resources = await helpResourceService.getAllHelpResources();
    return res.status(200).json(resources);
  } catch (error) {
    console.error('Error al obtener help_resources:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};