import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';
import { ValidationFailedError } from '../../../application/errors/ApplicationError.ts';
import { JobStage } from '../../../domain/stateMachines/JobStateMachine.ts';
import { PaymentMethod } from '../../../domain/entities/Invoice.ts';

export function createInternalRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  // Workshop technical staff: technicians, mechanics, advisors, managers, admins
  const workshopStaffGuard = authMiddleware.requireRole([
    'admin',
    'workshop_manager',
    'service_advisor',
    'advisor',
    'technician',
    'mechanic',
  ]);

  // Financial & Commercial staff: only advisors, workshop managers, and admins (SEC-STAFF-GRANULARITY)
  const commercialStaffGuard = authMiddleware.requireRole([
    'admin',
    'workshop_manager',
    'service_advisor',
    'advisor',
  ]);

  /**
   * POST /api/v1/internal/jobs/:id/stage
   * Advances the workshop job stage.
   */
  router.post('/jobs/:id/stage', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { targetStage } = req.body;

      if (!targetStage) {
        throw new ValidationFailedError('targetStage is required');
      }

      const updatedJob = await container.services.jobService.advanceJobStage(
        context,
        req.params.id,
        targetStage as JobStage
      );

      res.json({ job: updatedJob });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/internal/appointments/:id/confirm
   * Confirms an appointment slot.
   */
  router.post('/appointments/:id/confirm', authMiddleware.requireAuth(), commercialStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const appointment = await container.services.appointmentService.staffConfirmAppointment(
        req.context!,
        req.params.id
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/internal/appointments/:id/cancel
   * Cancels an appointment as commercial staff.
   */
  router.post('/appointments/:id/cancel', authMiddleware.requireAuth(), commercialStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const appointment = await container.services.appointmentService.staffCancelAppointment(
        req.context!,
        req.params.id
      );
      res.json({ appointment });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/internal/estimates
   * Workshop staff creates a draft estimate through EstimateApplicationService (SEC-HIGH-04).
   */
  router.post('/estimates', authMiddleware.requireAuth(), commercialStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const estimate = await container.services.estimateService.createDraftEstimate(context, req.body);

      res.status(201).json({
        estimate: {
          id: estimate.id,
          jobId: estimate.jobId,
          customerId: estimate.customerId,
          status: estimate.status,
          subtotalFils: estimate.subtotalFils,
          vatFils: estimate.vatFils,
          totalFils: estimate.totalFils,
          totalDisplay: estimate.totalDisplay,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/internal/estimates/:id/submit
   * Submits draft estimate to customer for review and decision through EstimateApplicationService (SEC-HIGH-04).
   */
  router.post('/estimates/:id/submit', authMiddleware.requireAuth(), commercialStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const estimate = await container.services.estimateService.submitEstimateToCustomer(context, req.params.id);

      res.json({
        estimate: {
          id: estimate.id,
          status: estimate.status,
          isActionable: estimate.isActionable,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/internal/invoices/generate
   * Generates authoritative invoice derived from ApprovalRecord.
   */
  router.post('/invoices/generate', authMiddleware.requireAuth(), commercialStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { approvalId } = req.body;

      if (!approvalId) {
        throw new ValidationFailedError('approvalId is required');
      }

      const invoice = await container.services.invoiceService.generateInvoiceFromApproval(context, approvalId);
      res.status(201).json({ invoice });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/internal/invoices/:id/record-payment
   * Records receipt of payment.
   */
  router.post('/invoices/:id/record-payment', authMiddleware.requireAuth(), commercialStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { paymentMethod } = req.body;

      if (!paymentMethod) {
        throw new ValidationFailedError('paymentMethod is required');
      }

      const invoice = await container.services.invoiceService.recordPayment(
        context,
        req.params.id,
        paymentMethod as PaymentMethod
      );

      res.json({ invoice });
    } catch (err) {
      next(err);
    }
  });

  
  /**
   * GET /api/v1/internal/jobs
   */
  router.get('/jobs', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const jobs = await container.services.jobService.getAllJobs(req.context!);
      res.json({ jobs });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/jobs/:id
   */
  router.get('/jobs/:id', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const job = await container.services.jobService.getJobDetailsForStaff(req.context!, req.params.id);
      res.json({ job });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/estimates
   */
  router.get('/estimates', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const estimates = await container.services.estimateService.getAllEstimates(req.context!);
      res.json({ estimates });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/invoices
   */
  router.get('/invoices', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const invoices = await container.services.invoiceService.getAllInvoices(req.context!);
      res.json({ invoices });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/customers
   */
  router.get('/customers', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const customers = await container.services.customerService.getAllCustomers(req.context);
      res.json({ customers });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/customers/:id
   */
  router.get('/customers/:id', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const customer = await container.services.customerService.getCustomerById(req.context, req.params.id);
      res.json({ customer });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/customers/:id/vehicles
   */
  router.get('/customers/:id/vehicles', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const vehicles = await container.services.vehicleService.listVehiclesForCustomerByStaff(req.context, req.params.id);
      res.json({ vehicles });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/vehicles/:id
   */
  router.get('/vehicles/:id', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const vehicle = await container.services.vehicleService.getVehicleByIdForStaff(req.context, req.params.id);
      res.json({ vehicle });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/vehicles/:id/jobs
   */
  router.get('/vehicles/:id/jobs', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const jobs = await container.services.jobService.listJobsForVehicleByStaff(req.context, req.params.id);
      res.json({ jobs });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/internal/customers/:id/jobs
   */
  router.get('/customers/:id/jobs', authMiddleware.requireAuth(), workshopStaffGuard, async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const jobs = await container.services.jobService.listJobsForCustomerByStaff(req.context, req.params.id);
      res.json({ jobs });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
