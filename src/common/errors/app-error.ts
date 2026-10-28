export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'No autenticado'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Acceso denegado'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Recurso no encontrado'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  static serviceUnavailable(message = 'Servicio no disponible'): AppError {
    return new AppError(503, 'SERVICE_UNAVAILABLE', message);
  }
}
