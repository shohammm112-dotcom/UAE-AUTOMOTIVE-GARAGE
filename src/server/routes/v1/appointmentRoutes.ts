import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';

export function createAppointmentRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/appointments
   */
  router.get('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const appointments = await container.services.appointmentService.listAppointmentsForCustomer(context);
      res.json({ appointments });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/appointments
   */
  router.post('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { vehicleId, serviceType, preferredDate, preferredTimeSlot, dropoffType, customerNotes } = req.body;
      const appointment = await container.services.appointmentService.requestAppointment(context, {
        vehicleId,
        serviceType: serviceType || 'Major Service',
        preferredDate,
        preferredTimeSlot,
        dropoffType: dropoffType || 'customer_dropoff',
        customerNotes,
      });

      res.status(201).json({ appointment });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/appointments/:id/cancel
   */
  router.post('/:id/cancel', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const appointment = await container.services.appointmentService.cancelAppointment(context, req.params.id);
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
