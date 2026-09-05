import http from 'http';
import { AddressInfo } from 'net';
import { TestRunner, assert, assertEquals } from './testUtils.ts';
import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { createExpressApp } from '../server/app.ts';
import { Customer } from '../domain/entities/Customer.ts';
import { Vehicle } from '../domain/entities/Vehicle.ts';
import { Job } from '../domain/entities/Job.ts';
import { Estimate, EstimateItem } from '../domain/entities/Estimate.ts';
import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../domain/valueObjects/UaePlate.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { MockAuthTokenVerifier } from '../infrastructure/mock/MockAuthTokenVerifier.ts';

export async function runApiBoundaryTests(runner: TestRunner): Promise<void> {
  runner.suite('HTTP API Boundary & Security Middleware');

  const container = createApplicationContainer({ mode: 'mock' });
  const app = createExpressApp(container);

  // Register mock auth tokens
  const mockVerifier = container.authVerifier as MockAuthTokenVerifier;
  mockVerifier.registerToken('mock_uid_customer_1', {
    uid: 'mock_uid_customer_1',
    email: 'hamdan@example.ae',
    name: 'Hamdan Al Maktoum',
    roles: ['customer'],
  });
  mockVerifier.registerToken('mock_uid_customer_2', {
    uid: 'mock_uid_customer_2',
    email: 'rashid@example.ae',
    name: 'Rashid Al Nuaimi',
    roles: ['customer'],
  });
  mockVerifier.registerToken('mock_staff_uid', {
    uid: 'mock_staff_uid',
    email: 'tariq@garage.ae',
    name: 'Tariq Advisor',
    roles: ['advisor', 'service_advisor', 'admin'],
  });

  // Seed domain entities
  const customer1 = new Customer({
    id: 'cust_api_1',
    authProviderId: 'mock_uid_customer_1',
    authProviderType: 'mock',
    fullName: 'Hamdan Al Maktoum',
    email: 'hamdan@example.ae',
    phone: '+971501112233',
    emirate: 'Dubai',
  });
  await container.repositories.customerRepo.save(customer1);

  const customer2 = new Customer({
    id: 'cust_api_2',
    authProviderId: 'mock_uid_customer_2',
    authProviderType: 'mock',
    fullName: 'Rashid Al Nuaimi',
    email: 'rashid@example.ae',
    phone: '+971509998877',
    emirate: 'Ajman',
  });
  await container.repositories.customerRepo.save(customer2);

  const vehicle1 = new Vehicle({
    id: 'veh_api_1',
    customerId: customer1.id,
    vin: VinNumber.fromString('WAUZZZ8V1KA123456'),
    plate: UaePlate.create('Dubai', 'A', '12345'),
    make: 'Audi',
    model: 'RS3',
    year: 2022,
    color: 'Nardo Grey',
    odometerReadingKm: 34000,
  });
  await container.repositories.vehicleRepo.save(vehicle1);

  const job1 = new Job({
    id: 'job_api_1',
    customerId: customer1.id,
    vehicleId: vehicle1.id,
    stage: 'intake_checkin',
    serviceAdvisorName: 'Tariq',
    customerConcern: 'Brake squeal and standard service',
    diagnosticSummary: 'Front pads at 15%',
    mileageInKm: 34000,
  });
  await container.repositories.jobRepo.save(job1);

  const estimateItem1: EstimateItem = {
    id: 'item_pads',
    type: 'part',
    description: 'Ceramic Front Brake Pads OEM',
    quantity: 1,
    unitPrice: MoneyAed.fromFils(125000), // 1,250.00 AED
    lineTotal: MoneyAed.fromFils(125000),
    isMandatory: true,
  };

  const estimateItem2: EstimateItem = {
    id: 'item_wipers',
    type: 'part',
    description: 'Aero Wiper Blade Pair',
    quantity: 1,
    unitPrice: MoneyAed.fromFils(20000), // 200.00 AED
    lineTotal: MoneyAed.fromFils(20000),
    isMandatory: false,
  };

  const estimate1 = new Estimate({
    id: 'est_api_1',
    jobId: job1.id,
    customerId: customer1.id,
    status: 'pending_customer_decision',
    items: [estimateItem1, estimateItem2],
  });
  await container.repositories.estimateRepo.save(estimate1);

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
    await runner.test('GET /api/health returns ok status and mode', async () => {
      const res = await request('/api/health');
      assertEquals(res.status, 200);
      assertEquals(res.data.status, 'ok');
      assertEquals(res.data.mode, 'mock');
    });

    await runner.test('Unauthenticated request to protected endpoint returns 401', async () => {
      const res = await request('/api/v1/customers/profile');
      assertEquals(res.status, 401);
      assertEquals(res.data.error.code, 'AUTHENTICATION_REQUIRED');
    });

    await runner.test('Authenticated customer 1 can retrieve their profile', async () => {
      const res = await request('/api/v1/customers/profile', {
        token: 'mock_uid_customer_1',
      });
      assertEquals(res.status, 200);
      assertEquals(res.data.profile.fullName, 'Hamdan Al Maktoum');
      assertEquals(res.data.profile.emirate, 'Dubai');
    });

    await runner.test('Authenticated customer 1 can list their registered vehicles', async () => {
      const res = await request('/api/v1/vehicles', {
        token: 'mock_uid_customer_1',
      });
      assertEquals(res.status, 200);
      assert(Array.isArray(res.data.vehicles), 'Expected vehicles array');
      assertEquals(res.data.vehicles.length, 1);
      assertEquals(res.data.vehicles[0].make, 'Audi');
      assertEquals(res.data.vehicles[0].vin, 'WAUZZZ8V1KA123456');
    });

    await runner.test('Authenticated customer 1 can register a new vehicle with UAE plate validation', async () => {
      const res = await request('/api/v1/vehicles', {
        method: 'POST',
        token: 'mock_uid_customer_1',
        body: {
          vin: 'WBA12345678901234',
          emirate: 'Dubai',
          plateCode: 'B',
          plateNumber: '5566',
          make: 'BMW',
          model: 'M4 Competition',
          year: 2023,
          color: 'Isle of Man Green',
          currentMileageKm: 12000,
        },
      });
      assertEquals(res.status, 201);
      assertEquals(res.data.vehicle.make, 'BMW');
      assertEquals(res.data.vehicle.plate.displayString, 'Dubai - B 5566');
    });

    await runner.test('BOLA / IDOR Protection: Customer 2 cannot access Customer 1 vehicle', async () => {
      const res = await request(`/api/v1/vehicles/${vehicle1.id}`, {
        token: 'mock_uid_customer_2',
      });
      assertEquals(res.status, 403);
      assertEquals(res.data.error.code, 'FORBIDDEN');
    });

    await runner.test('BOLA / IDOR Protection: Customer 2 cannot access Customer 1 estimate', async () => {
      const res = await request(`/api/v1/estimates/${estimate1.id}`, {
        token: 'mock_uid_customer_2',
      });
      assertEquals(res.status, 403);
      assertEquals(res.data.error.code, 'FORBIDDEN');
    });

    await runner.test('Customer 1 can view pending estimate with calculated fils totals', async () => {
      const res = await request(`/api/v1/estimates/${estimate1.id}`, {
        token: 'mock_uid_customer_1',
      });
      assertEquals(res.status, 200);
      assertEquals(res.data.estimate.id, estimate1.id);
      assertEquals(res.data.estimate.status, 'pending_customer_decision');
      assertEquals(res.data.estimate.subtotalFils, 145000); // 1250 + 200 = 1450 AED
      assertEquals(res.data.estimate.vatFils, 7250); // 5% VAT = 72.50 AED
      assertEquals(res.data.estimate.totalFils, 152250); // 1,522.50 AED
    });

    await runner.test('Authoritative decision submission: Customer approves item 1 and rejects item 2', async () => {
      const res = await request(`/api/v1/estimates/${estimate1.id}/decision`, {
        method: 'POST',
        token: 'mock_uid_customer_1',
        body: {
          decisions: [
            { itemId: 'item_pads', decision: 'approved' },
            { itemId: 'item_wipers', decision: 'rejected', reason: 'Replaced recently' },
          ],
        },
      });

      assertEquals(res.status, 200);
      assertEquals(res.data.success, true);
      assertEquals(res.data.estimate.status, 'locked');
      assertEquals(res.data.estimate.isLocked, true);
      // Approved total: 1250 AED + 5% VAT (62.50 AED) = 1312.50 AED = 131250 fils
      assertEquals(res.data.estimate.approvedTotalFils, 131250);
    });

    await runner.test('Atomic persistence: ApprovalRecord was saved and matches approved line items', async () => {
      const approval = await container.repositories.approvalRepo.findByEstimateId(estimate1.id);
      assert(approval !== null, 'Expected approval record to exist');
      assertEquals(approval!.approvedTotalFils, 131250);
      assertEquals(approval!.approvedItemIds.length, 1);
      assertEquals(approval!.approvedItemIds[0], 'item_pads');
      assertEquals(approval!.rejectedItemIds[0], 'item_wipers');
    });

    await runner.test('Idempotency / Lock enforcement: Re-submitting decision on sealed estimate does not corrupt state', async () => {
      const res = await request(`/api/v1/estimates/${estimate1.id}/decision`, {
        method: 'POST',
        token: 'mock_uid_customer_1',
        body: {
          decisions: [
            { itemId: 'item_pads', decision: 'approved' },
            { itemId: 'item_wipers', decision: 'approved' }, // malicious attempt to alter
          ],
        },
      });
      // Should return sealed state without modifying totals
      assertEquals(res.status, 200);
      assertEquals(res.data.estimate.approvedTotalFils, 131250);
    });

    await runner.test('Role Separation: Customer cannot call internal staff routes', async () => {
      const res = await request(`/api/v1/internal/jobs/${job1.id}/stage`, {
        method: 'POST',
        token: 'mock_uid_customer_1',
        body: { targetStage: 'inspection_in_progress' },
      });
      assertEquals(res.status, 403);
      assertEquals(res.data.error.code, 'FORBIDDEN');
    });

    await runner.test('Role Separation: Authorized staff can advance job stage and generate invoice', async () => {
      // Advance job stage
      const stageRes = await request(`/api/v1/internal/jobs/${job1.id}/stage`, {
        method: 'POST',
        token: 'mock_staff_uid',
        body: { targetStage: 'inspection_in_progress' },
      });
      assertEquals(stageRes.status, 200);
      assertEquals(stageRes.data.job.stage, 'inspection_in_progress');

      // Generate invoice from approval
      const approval = await container.repositories.approvalRepo.findByEstimateId(estimate1.id);
      const invRes = await request('/api/v1/internal/invoices/generate', {
        method: 'POST',
        token: 'mock_staff_uid',
        body: { approvalId: approval!.id },
      });
      assertEquals(invRes.status, 201);
      assertEquals(invRes.data.invoice.totalFils, 131250);
      assertEquals(invRes.data.invoice.status, 'issued');
    });

    await runner.test('Document Access: Ownership-verified short-lived signed URL generation', async () => {
      // Customer 1 requesting document for their own job
      const docRes = await request('/api/v1/documents/access-url', {
        method: 'POST',
        token: 'mock_uid_customer_1',
        body: {
          parentResourceType: 'job',
          parentResourceId: job1.id,
          documentKey: 'inspection_report.pdf',
        },
      });
      assertEquals(docRes.status, 200);
      assert(docRes.data.document.downloadUrl.includes('signature='), 'Expected signed download URL');
      assert(Boolean(docRes.data.document.expiresAt), 'Expected expiresAt timestamp');

      // Customer 2 requesting Customer 1's document -> 403
      const unauthorizedDocRes = await request('/api/v1/documents/access-url', {
        method: 'POST',
        token: 'mock_uid_customer_2',
        body: {
          parentResourceType: 'job',
          parentResourceId: job1.id,
          documentKey: 'inspection_report.pdf',
        },
      });
      assertEquals(unauthorizedDocRes.status, 403);
    });

    await runner.test('SEC-CRIT-02: Auth bootstrap strictly binds to verified token email and ignores client-supplied email', async () => {
      mockVerifier.registerToken('mock_attacker_uid', {
        uid: 'mock_attacker_uid',
        email: 'attacker@evil.com',
        name: 'Malicious Actor',
        roles: ['customer'],
      });

      // Attacker attempts to hijack Hamdan's existing account by passing Hamdan's email in request body
      const spoofAttemptRes = await request('/api/v1/auth/bootstrap', {
        method: 'POST',
        token: 'mock_attacker_uid',
        body: {
          email: 'hamdan@example.ae', // Spoofed email
          fullName: 'Fake Hamdan',
        },
      });

      assertEquals(spoofAttemptRes.status, 200);
      // Verify that the server bound strictly to the token claim ('attacker@evil.com'), NOT the spoofed body email!
      assertEquals(spoofAttemptRes.data.customer.email, 'attacker@evil.com');
      assert(spoofAttemptRes.data.customer.id !== customer1.id, 'Attacker must not obtain Hamdan customer ID');
    });

  } finally {
    server.close();
  }
}
