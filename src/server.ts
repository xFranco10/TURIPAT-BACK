import { createApp } from './app';
import { logger } from './common/utils/logger';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`TURIPAT-BACK escuchando en http://localhost:${env.PORT}${env.API_PREFIX}`);
  logger.info(`Swagger UI en http://localhost:${env.PORT}/api-docs`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} recibido, cerrando servidor...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
