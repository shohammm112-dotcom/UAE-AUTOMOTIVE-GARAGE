import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';

export function createCustomerRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/customers/profile
   */
  router.get('/profile', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const profile = await container.services.customerService.getProfile(context);
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /api/v1/customers/profile
   */
  router.patch('/profile', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { fullName, phone, emirate, preferredLanguage } = req.body;
      const updated = await container.services.customerService.updateProfile(context, {
        fullName,
        phone,
        emirate,
        preferredLanguage,
      });

      res.json({ profile: updated });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
