import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';
import { ValidationFailedError } from '../../../application/errors/ApplicationError.ts';

export function createAuthRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user and linked customer profile.
   */
  router.get('/me', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const customer = context.customerId
        ? await container.services.customerService.getProfile(context)
        : null;

      res.json({
        user: {
          uid: context.authenticatedProviderUid,
          roles: context.roles,
          actorType: context.actorType,
          customerId: customer ? customer.id : null,
          customer,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/auth/bootstrap
   * Idempotently resolves or provisions a domain Customer entity mapped from external authentication.
   */
  router.post('/bootstrap', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { fullName, phone } = req.body;

      if (!context.authenticatedProviderUid) {
        throw new ValidationFailedError('Authenticated UID required');
      }

      // Enforce SEC-CRIT-02: Use verified email from auth credentials only; client-supplied email is ignored
      const verifiedEmail =
        req.authIdentity?.email ||
        context.verifiedEmail ||
        `${context.authenticatedProviderUid}@motorist.ae`;

      const customer = await container.services.customerService.syncAuthenticatedCustomer({
        authProviderId: context.authenticatedProviderUid,
        authProviderType: 'firebase',
        verifiedEmail,
        fullName: fullName || 'UAE Motorist',
        phone: phone || '',
      });

      res.status(200).json({ customer });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
