import { AuthenticatedContext } from './AuthenticatedContext.ts';
import { AuthenticationRequiredError, AuthorizationForbiddenError } from '../errors/ApplicationError.ts';

export class AuthorizationGuard {
  public static assertAuthenticated(context: AuthenticatedContext): void {
    if (!context || !context.actorType) {
      throw new AuthenticationRequiredError('Missing authenticated context');
    }
  }

  /**
   * Enforces that the authenticated customer owns the targeted entity.
   * Defends against BOLA / IDOR attacks.
   */
  public static assertCustomerOwnsEntity(
    context: AuthenticatedContext,
    entityCustomerId: string,
    resourceName: string = 'Resource'
  ): void {
    this.assertAuthenticated(context);

    // System and authorized staff may inspect customer records
    if (context.actorType === 'system') return;
    if (context.actorType === 'staff') return;

    if (context.actorType === 'customer') {
      if (!context.customerId || context.customerId !== entityCustomerId) {
        throw new AuthorizationForbiddenError(
          `Unauthorized: You do not have permission to access or modify this ${resourceName}`
        );
      }
      return;
    }

    throw new AuthorizationForbiddenError(`Forbidden actor type: ${context.actorType}`);
  }

  /**
   * Strictly enforces that the caller is an authenticated customer who owns the entity.
   * Staff and system callers are strictly forbidden here to prevent forging customer decisions (SEC-HIGH-01).
   */
  public static assertCustomerOnly(
    context: AuthenticatedContext,
    entityCustomerId: string,
    resourceName: string = 'Resource'
  ): void {
    this.assertAuthenticated(context);

    if (context.actorType !== 'customer') {
      throw new AuthorizationForbiddenError(
        `Forbidden: Only authenticated customers can perform this action. Staff members cannot execute operations on behalf of customers via this endpoint.`
      );
    }

    if (!context.customerId || context.customerId !== entityCustomerId) {
      throw new AuthorizationForbiddenError(
        `Unauthorized: You do not have permission to access or modify this ${resourceName}`
      );
    }
  }

  /**
   * Enforces that the caller has a required staff role.
   * Customers attempting staff operations are immediately rejected.
   */
  public static assertStaffRole(context: AuthenticatedContext, requiredRoles: string[] = []): void {
    this.assertAuthenticated(context);

    if (context.actorType === 'system') return;

    if (context.actorType !== 'staff') {
      throw new AuthorizationForbiddenError('Staff authorization is required for this operation');
    }

    if (requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((r) => context.roles.includes(r));
      if (!hasRole) {
        throw new AuthorizationForbiddenError(
          `Missing required role. Requires one of: ${requiredRoles.join(', ')}`
        );
      }
    }
  }

  /**
   * Checks if caller is either the entity owner or staff.
   */
  public static assertCustomerOrStaff(
    context: AuthenticatedContext,
    entityCustomerId: string,
    resourceName: string = 'Resource'
  ): void {
    this.assertCustomerOwnsEntity(context, entityCustomerId, resourceName);
  }
}
