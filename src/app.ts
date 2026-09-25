
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import abuseTypeRoutes from './routes/abuseType.routes';
import adminReportRoutes from './routes/adminReport.routes';
import agentReportsRoutes from './routes/agentReports.routes';
import agentRoutes from './routes/agent.routes';
import authRoutes from './routes/auth.routes';
import educationalGuideRoutes from './routes/educationalGuide.routes';
import helpResourceRoutes from './routes/helpResource.routes';
import locationRoutes from './routes/location.routes';
import reportRoutes from './routes/report.routes';
import reportStatusRoutes from './routes/reportStatus.routes';
import statsRoutes from './routes/stats.routes';
import { UPLOADS_DIR } from './config/uploads';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Middlewares globales (se ejecutan en cada petición)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Evidencias subidas: se sirven estáticamente desde uploads/.
app.use('/uploads', express.static(UPLOADS_DIR));

// Montar rutas bajo /api
app.use('/api', authRoutes);
app.use('/api', adminReportRoutes);
app.use('/api', agentReportsRoutes);
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