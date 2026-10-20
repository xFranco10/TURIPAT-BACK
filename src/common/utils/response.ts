import type { Response } from 'express';

export interface SuccessBody<T> {
  success: true;
  data: T;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response<SuccessBody<T>> => res.status(statusCode).json({ success: true, data });
