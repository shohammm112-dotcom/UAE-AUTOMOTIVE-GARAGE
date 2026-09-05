import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';
import { ValidationFailedError } from '../../../application/errors/ApplicationError.ts';

export function createEstimateRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/estimates/:id
   */
  router.get('/:id', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const estimate = await container.services.estimateService.getEstimate(context, req.params.id);
      res.json({ estimate });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/estimates/:id/decision
   * Authoritative financial boundary:
   * Customer submits item approvals/rejections.
   * Server executes all calculations in integer fils, locks estimate, and saves ApprovalRecord atomically.
   */
  router.post('/:id/decision', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { decisions, itemDecisions, idempotencyKey } = req.body;
      const decisionList = decisions || itemDecisions;

      if (!Array.isArray(decisionList) || decisionList.length === 0) {
        throw new ValidationFailedError('decisions must be a non-empty array of item choices');
      }

      const estimate = await container.services.estimateService.submitCustomerDecision(context, {
        estimateId: req.params.id,
        decisions: decisionList,
        idempotencyKey,
      });

      res.json({
        success: true,
        estimate,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
