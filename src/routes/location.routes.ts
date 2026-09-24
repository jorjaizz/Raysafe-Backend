/**
 * @file location.routes.ts
 * @capa Routes (Rutas)
 * @descripcion Define las rutas del módulo "locations". Son catálogos
 *               públicos (sin autenticación) para poblar los formularios del
 *               frontend (departamentos y municipios de Guatemala).
 */
import { Router } from 'express';
import { getCitiesByDepartment, getDepartments } from '../controllers/location.controller';

const router = Router();

router.get('/locations/departments', getDepartments);
router.get('/locations/municipalities', getCitiesByDepartment);

export default router;