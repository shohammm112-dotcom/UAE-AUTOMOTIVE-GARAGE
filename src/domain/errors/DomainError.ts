export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidMoneyError extends DomainError {
  constructor(message: string = 'Invalid monetary amount') {
    super(message);
  }
}

export class InvalidVinError extends DomainError {
  constructor(message: string = 'Invalid VIN format') {
    super(message);
  }
}

export class InvalidPlateError extends DomainError {
  constructor(message: string = 'Invalid UAE vehicle plate') {
    super(message);
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(entityName: string, fromState: string, toState: string) {
    super(`Cannot transition ${entityName} from state "${fromState}" to "${toState}"`);
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID "${id}" was not found`);
  }
}
