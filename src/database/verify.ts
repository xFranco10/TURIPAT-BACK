import mongoose from 'mongoose';
import { logger } from '../common/utils/logger';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { collections } from './schema';

export interface CollectionReport {
  coleccion: string;
  existe: 'si' | 'NO';
  validador: 'si' | 'NO';
  esperados: number;
  reales: number;
  ttl: 'si' | '-';
}

/**
 * Lee el estado real de la base y lo compara con `collections.ts`.
 * No escribe nada: sirve para demostrar que el esquema quedó aplicado.
 */
export const buildReport = async (): Promise<CollectionReport[]> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('No hay conexión a MongoDB: llamá a connectDatabase() antes de verificar.');
  }

  const infos = await db.listCollections({}, { nameOnly: false }).toArray();
  const byName = new Map(infos.map((info) => [info.name, info]));

  const reports: CollectionReport[] = [];

  for (const spec of collections) {
    const info = byName.get(spec.name);
    const exists = info !== undefined;
    const hasValidator = exists && info.options?.validator !== undefined;

    const indexes = exists ? await db.collection(spec.name).indexes() : [];
    const hasTtl = indexes.some((index) => index.expireAfterSeconds !== undefined);

    reports.push({
      coleccion: spec.name,
      existe: exists ? 'si' : 'NO',
      validador: hasValidator ? 'si' : 'NO',
      // +1 porque MongoDB crea siempre el índice de `_id`.
      esperados: spec.indexes.length + 1,
      reales: indexes.length,
      ttl: hasTtl ? 'si' : '-',
    });
  }

  return reports;
};

const isIncomplete = (row: CollectionReport): boolean =>
  row.existe === 'NO' || row.validador === 'NO' || row.reales < row.esperados;

const main = async (): Promise<void> => {
  await connectDatabase();
  const report = await buildReport();

  logger.info(`Base: ${mongoose.connection.name}`);
  // eslint-disable-next-line no-console -- tabla legible para una herramienta de línea de comandos
  console.table(report);

  const incomplete = report.filter(isIncomplete);

  if (incomplete.length > 0) {
    logger.error(`Colecciones incompletas: ${incomplete.map((row) => row.coleccion).join(', ')}`);
    process.exitCode = 1;
  } else {
    logger.info(`Esquema completo: ${report.length} colecciones con validador e índices`);
  }
};

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(process.exitCode ?? 0);
  })
  .catch(async (error: unknown) => {
    logger.error('db:verify falló', error);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
