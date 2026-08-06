import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  constructor(
    message:    string,
    public readonly statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    public readonly code:       string = 'INTERNAL_ERROR',
    public readonly details?:   unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} introuvable`, StatusCodes.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('Données invalides', StatusCodes.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(resource: string) {
    super(`${resource} existe déjà`, StatusCodes.CONFLICT, 'CONFLICT');
  }
}
