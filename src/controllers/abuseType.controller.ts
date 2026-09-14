/**
 * @file abuseType.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as abuseTypeService from '../services/abuseType.service';
import { HttpError } from '../utils/HttpError';
import { parseId } from '../utils/parseId';

// GET /api/abuse-types
export const getAbuseTypes = async (_req: Request, res: Response) => {
  try {
    const abuseTypes = await abuseTypeService.getAllAbuseTypes();
    return res.status(200).json(abuseTypes);
  } catch (error) {
    console.error('Error al obtener abuse_types:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/abuse-types/:id
export const getAbuseType = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const abuseType = await abuseTypeService.getAbuseTypeById(id);

    if (!abuseType) {
      return res.status(404).json({ error: 'Tipo de abuso no encontrado' });
    }

    return res.status(200).json(abuseType);
  } catch (error) {
    console.error('Error al obtener abuse_type:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/abuse-types
export const postAbuseType = async (req: Request, res: Response) => {
  try {
    const created = await abuseTypeService.createAbuseType(req.body);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error al crear abuse_type:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PUT /api/abuse-types/:id
export const putAbuseType = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const updated = await abuseTypeService.updateAbuseType(id, req.body);

    if (!updated) {
      return res.status(404).json({ error: 'Tipo de abuso no encontrado' });
    }

    const abuseType = await abuseTypeService.getAbuseTypeById(id);
    return res.status(200).json(abuseType);
  } catch (error) {
    console.error('Error al actualizar abuse_type:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /api/abuse-types/:id
export const deleteAbuseType = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const deleted = await abuseTypeService.deleteAbuseType(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Tipo de abuso no encontrado' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al eliminar abuse_type:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};