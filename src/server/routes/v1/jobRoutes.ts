import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';

export function createJobRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/jobs
   * Returns active and past jobs for the authenticated customer.
   */
  router.get('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const jobs = await container.services.jobService.listJobsForCustomer(context);
      const activeJobs = jobs.filter((j) => j.stage !== 'delivered');

      res.json({
        activeJobs,
        history: jobs,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/jobs/:id
   * Returns full job details including inspection report findings.
   */
  router.get('/:id', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const job = await container.services.jobService.getJobDetails(context, req.params.id);
      res.json({ job });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
