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
import healthRoutes from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Middlewares globales (se ejecutan en cada petición)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Montar rutas bajo /api
app.use('/api', healthRoutes);

// Manejo de errores (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;