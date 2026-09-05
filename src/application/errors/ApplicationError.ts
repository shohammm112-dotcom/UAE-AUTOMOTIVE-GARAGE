export abstract class ApplicationError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationRequiredError extends ApplicationError {
  constructor(message: string = 'Authentication credentials required') {
    super(message, 401);
  }
}

export class AuthorizationForbiddenError extends ApplicationError {
  constructor(message: string = 'Access to this resource is forbidden') {
    super(message, 403);
  }
}

export class ResourceNotFoundError extends ApplicationError {
  constructor(resourceName: string, id: string) {
    super(`${resourceName} with ID "${id}" was not found`, 404);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationFailedError extends ApplicationError {
  constructor(message: string) {
    super(message, 400);
  }
}
