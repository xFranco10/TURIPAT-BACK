/**
 * MODELO DEL DOMINIO — interfaces/tipos de la entidad.
 * Cuando exista MongoDB, el esquema Mongoose vive junto a estos tipos.
 */
export interface Example {
  /** Identificador único (UUID v4). */
  id: string;
  /** Nombre corto del recurso. */
  name: string;
  /** Descripción opcional. */
  description?: string;
  /** Fecha de creación en ISO 8601. */
  createdAt: string;
}
