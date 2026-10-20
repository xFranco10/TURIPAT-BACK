import { Router } from 'express';
import { exampleRouter } from './modules/example/example.routes';
import { healthRouter } from './modules/health/health.routes';

/** Registro central de routers de módulos. Cada módulo nuevo se monta aquí. */
export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(exampleRouter);
