import { Request, Response, NextFunction } from 'express';
import { AppContainer } from '../../infrastructure/di/container.ts';
import { AuthenticatedContext } from '../../application/security/AuthenticatedContext.ts';
import { AuthenticationRequiredError, AuthorizationForbiddenError } from '../../application/errors/ApplicationError.ts';
import { VerifiedAuthIdentity } from '../../application/security/IAuthTokenVerifier.ts';

export interface AuthenticatedRequest extends Request {
  context?: AuthenticatedContext;
  authIdentity?: VerifiedAuthIdentity;
}

export function createAuthMiddleware(container: AppContainer) {
  const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1].trim();
    }
    return null;
  };

  const resolveContext = async (req: Request, token: string | null): Promise<AuthenticatedContext> => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!token) {
      return {
        actorType: 'customer',
        roles: Object.freeze(['anonymous']),
        requestId,
        ipAddress: ip,
        userAgent,
      };
    }

    const verified = await container.authVerifier.verifyToken(token);
    (req as AuthenticatedRequest).authIdentity = verified;
    const customer = await container.repositories.customerRepo.findByAuthProviderId(verified.uid);

    const isStaff = verified.roles.some((r) =>
      ['admin', 'workshop_manager', 'service_advisor', 'advisor', 'technician', 'mechanic'].includes(r)
    );

    return {
      customerId: customer ? customer.id : undefined,
      actorType: isStaff ? 'staff' : 'customer',
      roles: Object.freeze([...verified.roles]),
      staffId: isStaff ? verified.uid : undefined,
      verifiedEmail: verified.email,
      requestId,
      ipAddress: ip,
      userAgent,
      authenticatedProviderUid: verified.uid,
    };
  };

  return {
    requireAuth: () => async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      try {
        const token = extractToken(req);
        if (!token) {
          throw new AuthenticationRequiredError('Authorization Bearer token required');
        }
        const context = await resolveContext(req, token);
        if (!context.authenticatedProviderUid) {
          throw new AuthenticationRequiredError('Invalid or missing authentication credentials');
        }
        req.context = context;
        next();
      } catch (err) {
        next(err);
      }
    },

    optionalAuth: () => async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      try {
        const token = extractToken(req);
        req.context = await resolveContext(req, token);
        next();
      } catch {
        // Fallback gracefully to anonymous
        req.context = {
          actorType: 'customer',
          roles: Object.freeze(['anonymous']),
          requestId: `req_${Date.now()}`,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          userAgent: (req.headers['user-agent'] as string) || 'unknown',
        };
        next();
      }
    },

    requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      if (!req.context || !req.context.authenticatedProviderUid) {
        return next(new AuthenticationRequiredError('Authentication required'));
      }
      const hasRole = req.context.roles.some((r) => allowedRoles.includes(r));
      if (!hasRole) {
        return next(
          new AuthorizationForbiddenError(
            `Access denied. Requires one of [${allowedRoles.join(', ')}], user has [${req.context.roles.join(', ')}]`
          )
        );
      }
      next();
    },
  };
}
