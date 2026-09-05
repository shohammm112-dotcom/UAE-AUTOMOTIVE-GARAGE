import { CustomerId } from '../../domain/types.ts';

export type ActorType = 'customer' | 'staff' | 'system';

export interface AuthenticatedContext {
  readonly customerId?: CustomerId;
  readonly actorType: ActorType;
  readonly roles: readonly string[];
  readonly requestId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly authenticatedProviderUid?: string;
  readonly verifiedEmail?: string;
  readonly staffId?: string;
}

export class AuthenticatedContextFactory {
  public static forCustomer(params: {
    customerId: CustomerId;
    authenticatedProviderUid?: string;
    verifiedEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): AuthenticatedContext {
    return {
      customerId: params.customerId,
      actorType: 'customer',
      roles: Object.freeze(['customer']),
      requestId: params.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'App/1.0',
      authenticatedProviderUid: params.authenticatedProviderUid,
      verifiedEmail: params.verifiedEmail,
    };
  }

  public static forStaff(params: {
    roles: string[];
    staffId?: string;
    verifiedEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): AuthenticatedContext {
    return {
      actorType: 'staff',
      roles: Object.freeze([...params.roles]),
      staffId: params.staffId,
      verifiedEmail: params.verifiedEmail,
      requestId: params.requestId || `req_staff_${Date.now()}`,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'StaffERP/1.0',
    };
  }

  public static forSystem(params?: { requestId?: string }): AuthenticatedContext {
    return {
      actorType: 'system',
      roles: Object.freeze(['system']),
      requestId: params?.requestId || `sys_${Date.now()}`,
    };
  }
}
