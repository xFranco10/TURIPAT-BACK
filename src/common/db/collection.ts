import mongoose, { type mongo } from 'mongoose';
import type { CollectionName } from '../../database/schema';
import { AppError } from '../errors/app-error';

/** `_id` de MongoDB tal como lo entrega el driver. */
export type ObjectId = mongo.ObjectId;

/**
 * Documento tal como está guardado: el tipo de dominio más el `_id` que asigna Mongo.
 * Los `*.model.ts` describen el dominio sin `_id`; el helper lo añade aquí una sola vez.
 */
export type Stored<T> = T & { _id: ObjectId };

/**
 * Devuelve una colección tipada sobre el driver nativo.
 *
 * **Por qué no hay modelos Mongoose:** el esquema ya vive en Mongo como `$jsonSchema`
 * (`src/database/schema/`) y la entrada se valida con Zod en el borde, así que un
 * modelo sería una tercera definición del mismo esquema, libre de divergir de las otras dos.
 *
 * **Regla de propiedad:** solo el módulo dueño de una colección escribe en ella
 * (ver `context/agente/plan-modulos.md` §4). Leer las de otro está permitido;
 * duplicar su lógica de negocio, no.
 *
 * @throws AppError 503 `SERVICE_UNAVAILABLE` si todavía no hay conexión. `server.ts`
 * conecta antes de abrir el puerto, así que en producción esto solo pasa en tests o si
 * alguien usa el helper antes de `connectDatabase()`.
 */
export const getCollection = <T>(name: CollectionName): mongo.Collection<Stored<T>> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw AppError.serviceUnavailable('Base de datos no disponible');
  }
  return db.collection(name) as mongo.Collection<Stored<T>>;
};
