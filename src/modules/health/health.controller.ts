import type { RequestHandler } from 'express';
import { sendSuccess } from '../../common/utils/response';
import { getHealthStatus } from './health.service';

export const getHealth: RequestHandler = (_req, res) => {
  sendSuccess(res, getHealthStatus());
};
