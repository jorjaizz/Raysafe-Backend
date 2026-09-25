/**
 * @file agentReportTake.controller.ts
 * @capa Controller (Controlador)
 * @descripcion Recibe la petición HTTP para que un agente tome una denuncia,
 *               valida el risk_level, delega al Service y devuelve la respuesta.
 */
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import * as agentReportTakeService from '../services/agentReportTake.service';
import { parseId } from '../utils/parseId';
import { HttpError } from '../utils/HttpError';
import { pool } from '../config/database';

export const takeUnassignedReport = async (req: Request, res: Response) => {
  try {
    const id = parseId(req, res);
    if (id === null) return;

    const { risk_level } = req.body;

    if (!risk_level) {
      return res.status(400).json({ error: 'El campo risk_level es obligatorio' });
    }

    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    if (!validRiskLevels.includes(risk_level)) {
      return res.status(400).json({
        error: 'Nivel de riesgo inválido. Debe ser: low, medium, high o critical',
      });
    }

    const result = await agentReportTakeService.takeUnassignedReport(
      id,
      req.agent!.id,
      req.agent!.institution_id,
      risk_level,
    );

    if (!result) {
      return res.status(404).json({
        error: 'Denuncia no encontrada, ya asignada, no está en estado "Recibida" o no pertenece a tu institución',
      });
    }

    const [agentRows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM users WHERE id = ?',
      [req.agent!.id],
    );
    const agentName = agentRows[0]?.name ?? 'Agente';

    return res.status(200).json({
      message: 'Denuncia asignada correctamente',
      report: {
        ...result,
        agente_asignado: { id: req.agent!.id, name: agentName },
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al tomar denuncia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};