/**
 * @file agent.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP del panel admin, delega la lógica al
 *               Service y devuelve la respuesta. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as agentService from '../services/agent.service';
import { HttpError } from '../utils/HttpError';
import { parseId } from '../utils/parseId';

const parsePositiveInt = (value: unknown, fallback: number): number | null => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const n = Number(value);

  if (!Number.isInteger(n) || n < 1) {
    return null;
  }

  return n;
};

// POST /api/admin/agents
export const createAgent = async (req: Request, res: Response) => {
  try {
    const created = await agentService.createAgent({
      ...req.body,
      institutionId: req.admin!.institution_id,
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al crear agente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/admin/agents?page=1&limit=10&search=&active=true|false
export const getAgents = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

    let active: boolean | undefined;
    const rawActive = req.query.active;

    if (rawActive !== undefined) {
      if (rawActive === 'true' || rawActive === '1') {
        active = true;
      } else if (rawActive === 'false' || rawActive === '0') {
        active = false;
      } else {
        return res.status(400).json({
          error: "El parámetro active debe ser 'true' o 'false'",
        });
      }
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);

    if (page === null || limit === null) {
      return res.status(400).json({
        error: 'Los parámetros page y limit deben ser números enteros positivos',
      });
    }

    const result = await agentService.listAgents({
      institutionId: req.admin!.institution_id,
      page,
      limit,
      search,
      active,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al listar agentes:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/admin/agents/:id
export const getAgent = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const agent = await agentService.getAgentDetail(id, req.admin!.institution_id);

    if (!agent) {
      return res.status(404).json({ error: 'Agente no encontrado' });
    }

    return res.status(200).json(agent);
  } catch (error) {
    console.error('Error al obtener agente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PATCH /api/admin/agents/:id
export const updateAgent = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const updated = await agentService.updateAgent(
      id,
      req.admin!.institution_id,
      req.body,
    );

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error al actualizar agente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};