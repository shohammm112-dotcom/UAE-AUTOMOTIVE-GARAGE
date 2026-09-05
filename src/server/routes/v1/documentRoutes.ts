import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';
import { ValidationFailedError } from '../../../application/errors/ApplicationError.ts';

export function createDocumentRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * POST /api/v1/documents/access-url
   * Generates a short-lived signed URL for a private document ONLY after
   * verifying customer owns the parent entity (Job, Inspection, or Invoice).
   */
  router.post('/access-url', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { parentResourceType, parentResourceId, documentKey } = req.body;

      if (!parentResourceType || !parentResourceId || !documentKey) {
        throw new ValidationFailedError('parentResourceType, parentResourceId, and documentKey are required');
      }

      const result = await container.services.documentService.getSecureDocumentUrl(context, {
        parentResourceType,
        parentResourceId,
        documentKey,
      });

      res.json({ document: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
