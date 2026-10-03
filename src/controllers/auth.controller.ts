/**
 * @file auth.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP de login/me, delega en el Service
 *               y devuelve la respuesta. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { HttpError } from '../utils/HttpError';

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/me
export const me = async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe(req.user!.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};