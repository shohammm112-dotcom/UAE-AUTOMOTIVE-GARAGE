import express, { Express } from 'express';
import { AppContainer } from '../infrastructure/di/container.ts';
import { createSecurityMiddleware } from './middleware/securityMiddleware.ts';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware.ts';
import { RuntimeEnvironment } from '../infrastructure/config/RuntimeEnvironment.ts';

import { createAuthRoutes } from './routes/v1/authRoutes.ts';
import { createCustomerRoutes } from './routes/v1/customerRoutes.ts';
import { createVehicleRoutes } from './routes/v1/vehicleRoutes.ts';
import { createAppointmentRoutes } from './routes/v1/appointmentRoutes.ts';
import { createJobRoutes } from './routes/v1/jobRoutes.ts';
import { createEstimateRoutes } from './routes/v1/estimateRoutes.ts';
import { createInvoiceRoutes } from './routes/v1/invoiceRoutes.ts';
import { createDocumentRoutes } from './routes/v1/documentRoutes.ts';
import { createNotificationRoutes } from './routes/v1/notificationRoutes.ts';
import { createInternalRoutes } from './routes/v1/internalRoutes.ts';

export function createExpressApp(container: AppContainer): Express {
  const app = express();

  // 1. Security & Core Middlewares
  const security = createSecurityMiddleware();
  app.use(security.helmetMiddleware);
  app.use(security.corsMiddleware);
  app.use(security.rateLimiterMiddleware);

  // Request body parsing with safe payload limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 2. Health & Diagnostics
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      // Withheld in production: `mode` told an unauthenticated caller whether an
      // instance was running mock authentication, i.e. whether it was exploitable.
      ...(RuntimeEnvironment.isProduction() ? {} : { mode: container.mode }),
      timestamp: new Date().toISOString(),
      service: 'uae-garage-digital-platform-api',
    });
  });

  // 3. API v1 Routes
  const apiV1Router = express.Router();
  apiV1Router.use('/auth', createAuthRoutes(container));
  apiV1Router.use('/customers', createCustomerRoutes(container));
  apiV1Router.use('/vehicles', createVehicleRoutes(container));
  apiV1Router.use('/appointments', createAppointmentRoutes(container));
  apiV1Router.use('/jobs', createJobRoutes(container));
  apiV1Router.use('/estimates', createEstimateRoutes(container));
  apiV1Router.use('/invoices', createInvoiceRoutes(container));
  apiV1Router.use('/documents', createDocumentRoutes(container));
  apiV1Router.use('/notifications', createNotificationRoutes(container));
  apiV1Router.use('/internal', createInternalRoutes(container));

  app.use('/api/v1', apiV1Router);

  // 4. Centralized API Error Handling Middleware
  app.use(errorHandlerMiddleware);

  return app;
}
