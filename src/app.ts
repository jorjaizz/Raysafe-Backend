/**
 * @file app.ts
 * @descripcion Configura la aplicación Express: middlewares globales,
 *               montaje de rutas y manejo de errores. No arranca el servidor
 *               (eso lo hace server.ts); así es más fácil probarla.
 *
 * Paquetes usados:
 * - express -> framework web (router, json parsing).
 * - cors    -> permite peticiones desde otros orígenes (útil para el frontend).
 * - helmet  -> añade cabeceras HTTP de seguridad.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import abuseTypeRoutes from './routes/abuseType.routes';
import adminReportRoutes from './routes/adminReport.routes';
import agentReportRoutes from './routes/agentReport.routes';
import agentRoutes from './routes/agent.routes';
import authRoutes from './routes/auth.routes';
import educationalGuideRoutes from './routes/educationalGuide.routes';
import helpResourceRoutes from './routes/helpResource.routes';
import locationRoutes from './routes/location.routes';
import reportRoutes from './routes/report.routes';
import reportStatusRoutes from './routes/reportStatus.routes';
import statsRoutes from './routes/stats.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Middlewares globales (se ejecutan en cada petición)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Montar rutas bajo /api
app.use('/api', authRoutes);
app.use('/api', adminReportRoutes);
app.use('/api', agentReportRoutes);
app.use('/api', agentRoutes);
app.use('/api', abuseTypeRoutes);
app.use('/api', locationRoutes);
app.use('/api', reportRoutes);
app.use('/api', reportStatusRoutes);
app.use('/api', educationalGuideRoutes);
app.use('/api', helpResourceRoutes);
app.use('/api', statsRoutes);

// Manejo de errores (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;