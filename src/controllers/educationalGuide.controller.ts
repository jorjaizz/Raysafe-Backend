/**
 * @file educationalGuide.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as educationalGuideService from '../services/educationalGuide.service';

// GET /api/educational-guides
export const getEducationalGuides = async (_req: Request, res: Response) => {
  try {
    const guides = await educationalGuideService.getAllEducationalGuides();
    return res.status(200).json(guides);
  } catch (error) {
    console.error('Error al obtener educational_guides:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};