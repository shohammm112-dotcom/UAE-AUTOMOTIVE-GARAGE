import http from 'http';
import { AddressInfo } from 'net';
import { TestRunner, assertEquals, assert } from './testUtils.ts';
import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { createExpressApp } from '../server/app.ts';
import { Customer } from '../domain/entities/Customer.ts';
import { Vehicle } from '../domain/entities/Vehicle.ts';
import { Job } from '../domain/entities/Job.ts';
import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../domain/valueObjects/UaePlate.ts';
import { MockAuthTokenVerifier } from '../infrastructure/mock/MockAuthTokenVerifier.ts';

export async function runStaffJobOperationsTests(runner: TestRunner): Promise<void> {
  runner.suite('Staff Job Operations & Workshop Execution (Step 5.5)');

  const container = createApplicationContainer({ mode: 'mock' });
  const app = createExpressApp(container);

  const mockVerifier = container.authVerifier as MockAuthTokenVerifier;
  mockVerifier.registerToken('mock_cust_token', {
    uid: 'mock_cust_uid',
    email: 'customer@garage.ae',
    name: 'Customer One',
    roles: ['customer'],
  });

  mockVerifier.registerToken('mock_advisor_token', {
    uid: 'mock_advisor_uid',
    email: 'advisor@garage.ae',
    name: 'Advisor Adam',
    roles: ['advisor', 'service_advisor'],
  });

  mockVerifier.registerToken('mock_mechanic_token', {
    uid: 'mock_mechanic_uid',
    email: 'mechanic@garage.ae',
    name: 'Mechanic Mike',
    roles: ['mechanic', 'technician'],
  });

  mockVerifier.registerToken('mock_manager_token', {
    uid: 'mock_manager_uid',
    email: 'manager@garage.ae',
    name: 'Manager Maria',
    roles: ['workshop_manager'],
  });

  // Seed domain entities
  const customer = new Customer({
    id: 'cust_stage_1',
    authProviderId: 'mock_cust_uid',
    authProviderType: 'mock',
    fullName: 'Customer One',
    email: 'customer@garage.ae',
    phone: '+971501112233',
    emirate: 'Dubai',
  });
  await container.repositories.customerRepo.save(customer);

  const vehicle = new Vehicle({
    id: 'veh_stage_1',
    customerId: customer.id,
    vin: VinNumber.fromString('WAUZZZ8V1KA999999'),
    plate: UaePlate.create('Dubai', 'B', '99999'),
    make: 'Porsche',
    model: '911 GT3',
    year: 2023,
    color: 'Shark Blue',
    odometerReadingKm: 12000,
  });
  await container.repositories.vehicleRepo.save(vehicle);

  const testJob = new Job({
    id: 'job_op_test_1',
    customerId: customer.id,
    vehicleId: vehicle.id,
    stage: 'intake_checkin',
    serviceAdvisorName: 'Advisor Adam',
    customerConcern: 'Track day prep and brake fluid flush',
    diagnosticSummary: 'Pads 80%, fluid needs change',
    mileageInKm: 12000,
  });
  await container.repositories.jobRepo.save(testJob);

  // Spin up ephemeral test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (
    path: string,
    options: {
      method?: string;
      token?: string;
      body?: unknown;
    } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data, headers: res.headers };
  };

  try {
    await runner.test('job operational read: authorized staff can retrieve job details via internal API', async () => {
      const res = await request(`/api/v1/internal/jobs/${testJob.id}`, {
        token: 'mock_advisor_token',
      });
      assertEquals(res.status, 200);
      assert(res.data && res.data.job, 'Expected job in response');
      assertEquals(res.data.job.id, testJob.id);
      assertEquals(res.data.job.stage, 'intake_checkin');
      assertEquals(res.data.job.serviceAdvisorName, 'Advisor Adam');
      assertEquals(res.data.job.customerConcern, 'Track day prep and brake fluid flush');
    });

    await runner.test('customer blocked from staff job detail read (403)', async () => {
      const res = await request(`/api/v1/internal/jobs/${testJob.id}`, {
        token: 'mock_cust_token',
      });
      assertEquals(res.status, 403);
      assertEquals(res.data.error.code, 'FORBIDDEN');
    });

    await runner.test('customer blocked from staff stage mutation (403)', async () => {
      const res = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_cust_token',
        body: { targetStage: 'inspection_in_progress' },
      });
      assertEquals(res.status, 403);
      assertEquals(res.data.error.code, 'FORBIDDEN');
    });

    await runner.test('unauthenticated stage mutation blocked (401)', async () => {
      const res = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        body: { targetStage: 'inspection_in_progress' },
      });
      assertEquals(res.status, 401);
      assertEquals(res.data.error.code, 'AUTHENTICATION_REQUIRED');
    });

    await runner.test('authorized staff mutation succeeds: intake_checkin -> inspection_in_progress', async () => {
      const res = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_advisor_token',
        body: { targetStage: 'inspection_in_progress' },
      });
      assertEquals(res.status, 200);
      assertEquals(res.data.job.stage, 'inspection_in_progress');

      // Verify persistence
      const persisted = await container.repositories.jobRepo.findById(testJob.id);
      assert(persisted !== null, 'Expected persisted job');
      assertEquals(persisted!.stage, 'inspection_in_progress');
    });

    await runner.test('mechanic mutation succeeds: inspection_in_progress -> estimate_pending', async () => {
      const res = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_mechanic_token',
        body: { targetStage: 'estimate_pending' },
      });
      assertEquals(res.status, 200);
      assertEquals(res.data.job.stage, 'estimate_pending');
    });

    await runner.test('invalid stage transition rejected by domain state machine (400 BAD_REQUEST)', async () => {
      // Current stage is estimate_pending. Attempt illegal transition directly to delivered
      const res = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_advisor_token',
        body: { targetStage: 'delivered' },
      });
      assertEquals(res.status, 400);
      assertEquals(res.data.error.code, 'INVALID_STATE_TRANSITION');
      assert(
        res.data.error.message.includes('transition') || res.data.error.message.includes('Invalid'),
        'Expected invalid state transition error message'
      );

      // Verify state was NOT modified
      const current = await container.repositories.jobRepo.findById(testJob.id);
      assertEquals(current!.stage, 'estimate_pending');
    });

    await runner.test('valid branching transition: estimate_pending -> repair_in_progress -> quality_control', async () => {
      // Branch 1: Move to repair_in_progress
      const res1 = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_manager_token',
        body: { targetStage: 'repair_in_progress' },
      });
      assertEquals(res1.status, 200);
      assertEquals(res1.data.job.stage, 'repair_in_progress');

      // Move to quality_control
      const res2 = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_mechanic_token',
        body: { targetStage: 'quality_control' },
      });
      assertEquals(res2.status, 200);
      assertEquals(res2.data.job.stage, 'quality_control');
    });

    await runner.test('QC loop rejection / pass: quality_control -> ready_for_delivery -> delivered', async () => {
      // Pass QC -> ready_for_delivery
      const res1 = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_advisor_token',
        body: { targetStage: 'ready_for_delivery' },
      });
      assertEquals(res1.status, 200);
      assertEquals(res1.data.job.stage, 'ready_for_delivery');

      // Final delivery
      const res2 = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_advisor_token',
        body: { targetStage: 'delivered' },
      });
      assertEquals(res2.status, 200);
      assertEquals(res2.data.job.stage, 'delivered');

      // Delivered is terminal: cannot transition further
      const res3 = await request(`/api/v1/internal/jobs/${testJob.id}/stage`, {
        method: 'POST',
        token: 'mock_advisor_token',
        body: { targetStage: 'repair_in_progress' },
      });
      assertEquals(res3.status, 400);
      assertEquals(res3.data.error.code, 'INVALID_STATE_TRANSITION');
    });

  } finally {
    server.close();
  }
}
