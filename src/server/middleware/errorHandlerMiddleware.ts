import { Request, Response, NextFunction } from 'express';
import {
  ApplicationError,
  AuthenticationRequiredError,
  AuthorizationForbiddenError,
  ResourceNotFoundError,
  ValidationFailedError,
} from '../../application/errors/ApplicationError.ts';
import {
  DomainError,
  InvalidStateTransitionError,
  InvariantViolationError,
} from '../../domain/errors/DomainError.ts';

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal error occurred';
  let details: unknown = undefined;

  if (err instanceof AuthenticationRequiredError) {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_REQUIRED';
    message = err.message;
  } else if (err instanceof AuthorizationForbiddenError) {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = err.message;
  } else if (err instanceof ResourceNotFoundError) {
    statusCode = 404;
    errorCode = 'RESOURCE_NOT_FOUND';
    message = err.message;
  } else if (err instanceof InvalidStateTransitionError) {
    statusCode = 400;
    errorCode = 'INVALID_STATE_TRANSITION';
    message = err.message;
  } else if (err instanceof InvariantViolationError) {
    statusCode = 400;
    errorCode = 'INVARIANT_VIOLATION';
    message = err.message;
  } else if (err instanceof ValidationFailedError) {
    statusCode = 400;
    errorCode = 'VALIDATION_FAILED';
    message = err.message;
  } else if (err.name === 'ConflictError' || err.name === 'ConcurrencyConflictError') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = err.message;
  } else if (err instanceof ApplicationError || err instanceof DomainError) {
    statusCode = 400;
    errorCode = err.name || 'DOMAIN_ERROR';
    message = err.message;
  } else {
    // Unhandled exception: do not leak server stack in production
    console.error('[Unhandled API Error]', err);
    message = process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred'
      : err.message || 'Internal Server Error';
  }

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
  });
}
