import mongoose from 'mongoose';
import { logger } from '../common/utils/logger';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { collections, type CollectionSpec } from './schema';

const VALIDATION_OPTIONS = {
  validationLevel: 'strict',
  validationAction: 'error',
} as const;

/**
 * Aplica la definición de `collections.ts` sobre la base conectada.
 * Es idempotente: crea lo que falta, actualiza el validador de lo existente y
 * vuelve a pedir los índices (con nombre fijo, así que no se duplican).
 */
export const applyCollections = async (specs: CollectionSpec[] = collections): Promise<void> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('No hay conexión a MongoDB: llamá a connectDatabase() antes de aplicar el esquema.');
  }

  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((info) => info.name),
  );

  for (const spec of specs) {
    const validator = { $jsonSchema: spec.validator };

    if (existing.has(spec.name)) {
      await db.command({
        collMod: spec.name,
        validator,
        ...VALIDATION_OPTIONS,
      });
      logger.info(`Validador actualizado: ${spec.name}`);
    } else {
      await db.createCollection(spec.name, { validator, ...VALIDATION_OPTIONS });
      logger.info(`Colección creada: ${spec.name}`);
    }

    const collection = db.collection(spec.name);
    for (const index of spec.indexes) {
      await collection.createIndex(index.key, index.options);
    }
    logger.info(`  ${spec.indexes.length} índice(s) aplicados`);
  }
};

const main = async (): Promise<void> => {
  await connectDatabase();
  await applyCollections();
  logger.info(`Esquema aplicado: ${collections.length} colecciones`);
};

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    logger.error('db:setup falló', error);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
