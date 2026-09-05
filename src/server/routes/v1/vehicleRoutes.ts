import { Router, Response } from 'express';
import { AppContainer } from '../../../infrastructure/di/container.ts';
import { AuthenticatedRequest, createAuthMiddleware } from '../../middleware/authMiddleware.ts';

export function createVehicleRoutes(container: AppContainer): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(container);

  /**
   * GET /api/v1/vehicles
   * Lists customer vehicles with strict ownership enforcement.
   */
  router.get('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const vehicles = await container.services.vehicleService.listVehiclesForCustomer(context);
      res.json({ vehicles });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/vehicles/:id
   */
  router.get('/:id', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const vehicle = await container.services.vehicleService.getVehicleById(context, req.params.id);
      res.json({ vehicle });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/vehicles
   * Registers a new vehicle for the customer.
   */
  router.post('/', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { vin, emirate, plateCode, plateNumber, make, model, year, color, currentMileageKm } = req.body;
      const vehicle = await container.services.vehicleService.registerVehicle(context, {
        vin,
        emirate: emirate || 'Dubai',
        plateCode: plateCode || 'A',
        plateNumber: plateNumber || '1000',
        make,
        model,
        year: Number(year),
        color: color || 'White',
        currentMileageKm: Number(currentMileageKm || 0),
      });

      res.status(201).json({ vehicle });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /api/v1/vehicles/:id/mileage
   */
  router.patch('/:id/mileage', authMiddleware.requireAuth(), async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const context = req.context!;
      const { mileageKm } = req.body;
      const vehicle = await container.services.vehicleService.updateMileage(context, req.params.id, Number(mileageKm));
      res.json({ vehicle });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
