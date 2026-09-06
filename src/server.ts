/**
 * @file server.ts
 * @capa Entry point (Entrada)
 * @descripcion Arranca el servidor HTTP que escucha en el puerto configurado.
 *               Es el único archivo que se ejecuta (dev: tsx watch src/server.ts).
 */
import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  console.log(`Health check: http://localhost:${env.PORT}/api/health`);
});