import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';

export function createInvoiceRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/invoices
   */
  router.get('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const invoices = await container.services.invoiceService.listInvoicesForCustomer(context);
      res.json({ invoices });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/invoices/:id
   */
  router.get('/:id', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const invoice = await container.services.invoiceService.getInvoiceById(context, req.params.id);
      res.json({ invoice });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
