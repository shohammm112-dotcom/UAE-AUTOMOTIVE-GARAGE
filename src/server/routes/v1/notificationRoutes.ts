import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';
import { AuthorizationGuard } from '../../../application/security/AuthorizationGuard.ts';
import { ResourceNotFoundError } from '../../../application/errors/ApplicationError.ts';

export function createNotificationRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/notifications
   */
  router.get('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      if (!context.customerId) {
        return res.json({ notifications: [] });
      }

      const notifications = await container.repositories.notificationRepo.findByCustomerId(context.customerId);
      res.json({
        notifications: notifications.map((n) => ({
          id: n.id,
          channel: n.channel,
          title: n.title,
          body: n.body,
          metadata: n.metadata,
          read: n.read,
          createdAt: n.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/notifications/:id/read
   */
  router.post('/:id/read', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const notification = await container.repositories.notificationRepo.findById(req.params.id);
      if (!notification) {
        throw new ResourceNotFoundError('Notification', req.params.id);
      }

      AuthorizationGuard.assertCustomerOwnsEntity(context, notification.customerId, 'Notification');
      notification.markAsRead();
      await container.repositories.notificationRepo.update(notification);

      res.json({ success: true, notificationId: notification.id });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
