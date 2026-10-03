/**
 * @file location.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP, delega la lógica al Service
 *               y devuelve la respuesta al cliente. No conoce MySQL.
 */
import type { Request, Response } from 'express';
import * as locationService from '../services/location.service';

// GET /api/locations/departments
export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await locationService.getDepartments();
    return res.status(200).json(departments);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/locations/municipalities?department=X
export const getCitiesByDepartment = async (req: Request, res: Response) => {
  try {
    const department = req.query.department;

    if (typeof department !== 'string' || department.trim() === '') {
      return res.status(400).json({ error: 'El parámetro department es obligatorio' });
    }

    const cities = await locationService.getCitiesByDepartment(department.trim());
    return res.status(200).json(cities);
  } catch (error) {
    console.error('Error al obtener municipios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};