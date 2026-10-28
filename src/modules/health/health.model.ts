import type { DatabaseState } from '../../config/database';

export interface HealthStatus {
  status: 'ok';
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  db: DatabaseState;
}
