import { createApp } from './app';
import { logger } from './common/utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';

const app = createApp();

const start = async (): Promise<void> => {
  // Primero la base: si no conecta, no tiene sentido abrir el puerto.
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`TURIPAT-BACK escuchando en http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`Swagger UI en http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} recibido, cerrando servidor...`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error: unknown) => {
  logger.error('No se pudo iniciar la aplicación', error);
  process.exit(1);
});
