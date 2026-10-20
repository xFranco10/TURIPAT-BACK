import { env } from '../../config/env';
import type { HealthStatus } from './health.model';

export const getHealthStatus = (): HealthStatus => ({
  status: 'ok',
  environment: env.NODE_ENV,
  uptimeSeconds: Math.round(process.uptime()),
  timestamp: new Date().toISOString(),
});
