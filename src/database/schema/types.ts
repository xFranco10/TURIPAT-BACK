/**
 * Definición declarativa del modelo de datos (ver `Documentación/Modelo de datos/`).
 * Cada colección trae su validador `$jsonSchema` y sus índices, con nombre explícito
 * para que `db:verify` pueda comprobarlos y para que un `createIndex` repetido no
 * genere nombres distintos.
 */

export type JsonSchema = Record<string, unknown>;

export interface IndexSpec {
  key: Record<string, 1 | -1 | '2dsphere' | 'text'>;
  options: {
    name: string;
    unique?: boolean;
    partialFilterExpression?: Record<string, unknown>;
    expireAfterSeconds?: number;
  };
}

export interface CollectionSpec {
  name: string;
  validator: JsonSchema;
  indexes: IndexSpec[];
}
