import mongoose from 'mongoose';
import { logger } from '../common/utils/logger';
import { env } from './env';

export type DatabaseState = 'connected' | 'disconnected' | 'connecting' | 'disconnecting';

/**
 * Devuelve el nombre de base indicado en la cadena de conexión, o '' si no trae ninguno.
 * Atlas entrega la cadena sin nombre de base; usada así, Mongoose conecta a `test` en
 * silencio. Preferimos detectarlo y fallar con un mensaje claro.
 */
export const databaseNameFromUri = (uri: string): string => {
  const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const slashIndex = withoutScheme.indexOf('/');
  if (slashIndex === -1) {
    return '';
  }
  const path = withoutScheme.slice(slashIndex + 1);
  const questionMark = path.indexOf('?');
  return (questionMark === -1 ? path : path.slice(0, questionMark)).trim();
};

/**
 * Traduce el readyState de Mongoose (0..3) a un estado legible.
 * Se usa un switch en lugar de un mapa indexado para que TypeScript no tenga
 * que asumir que todos los números están cubiertos.
 */
export const getDatabaseState = (): DatabaseState => {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
};

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB conectada', { database: mongoose.connection.name });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB desconectada');
  });

  mongoose.connection.on('error', (error: unknown) => {
    logger.error('Error de conexión con MongoDB', error);
  });

  // Falla rápido si la cadena es inválida o la red no llega al cluster,
  // en lugar de quedarse colgado el minuto que dura el timeout por defecto.
  if (databaseNameFromUri(env.MONGODB_URI) === '') {
    throw new Error(
      'MONGODB_URI debe incluir el nombre de la base (ejemplo: .../turipat?retryWrites=true&w=majority). Sin él, MongoDB usa la base "test" sin avisar.',
    );
  }

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  logger.info('Conexión a MongoDB establecida', { database: mongoose.connection.name });
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('Conexión a MongoDB cerrada');
};
