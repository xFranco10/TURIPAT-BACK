import { randomUUID } from 'node:crypto';
import { AppError } from '../../common/errors/app-error';
import type { CreateExampleInput } from './example.schema';
import type { Example } from './example.model';

/**
 * SERVICE — lógica de negocio pura. NO conoce req/res de Express.
 * Aquí vive la validación de reglas de negocio (límites, estados, permisos...)
 * y el acceso a datos queda detrás (futuro repositorio/Mongoose).
 *
 * NOTA didáctica: este módulo guarda en memoria un array para poder
 * demostrar CRUD sin base de datos. En un módulo real, los datos viven
 * en MongoDB y este service consulta el modelo de Mongoose.
 */
const MAX_ITEMS = 10;

/** Almacén en memoria SOLO con fines de ejemplo. */
const store = new Map<string, Example>();

export const listExamples = (): Example[] => [...store.values()];

export const getExample = (id: string): Example => {
  const example = store.get(id);
  if (!example) {
    throw AppError.notFound('Ejemplo no encontrado');
  }
  return example;
};

export const createExample = (input: CreateExampleInput): Example => {
  // Regla de negocio de ejemplo: cupo máximo.
  if (store.size >= MAX_ITEMS) {
    throw AppError.conflict(`Se alcanzó el límite de ${MAX_ITEMS} ejemplos`);
  }

  const created: Example = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    createdAt: new Date().toISOString(),
  };
  store.set(created.id, created);
  return created;
};

export const deleteExample = (id: string): void => {
  if (!store.delete(id)) {
    throw AppError.notFound('Ejemplo no encontrado');
  }
};
