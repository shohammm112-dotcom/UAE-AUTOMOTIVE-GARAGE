import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Vehicle } from '../domain/entities/Vehicle.ts';
import { Job } from '../domain/entities/Job.ts';
import { Estimate, EstimateItem } from '../domain/entities/Estimate.ts';
import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../domain/valueObjects/UaePlate.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { AuthenticatedContextFactory } from '../application/security/AuthenticatedContext.ts';
import { AuthorizationForbiddenError } from '../application/errors/ApplicationError.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

export async function runOwnershipAndAuthorizationTests(runner: TestRunner): Promise<void> {
  runner.suite('Security: BOLA/IDOR Defense & Privilege Separation', () => {});

  const setupMultiTenantData = async (container: ReturnType<typeof createApplicationContainer>) => {
    const customerA = 'cust_alice';
    const customerB = 'cust_bob';

    // Alice's Vehicle
    const vehicleA = new Vehicle({
      id: 'veh_alice_01',
      customerId: customerA,
      vin: VinNumber.fromString('1HGCR2F83HA000001'),
      plate: UaePlate.create('Dubai', 'B', '1001'),
      make: 'Porsche',
      model: 'Cayenne GTS',
      year: 2022,
      color: 'Chalk White',
      odometerReadingKm: 42000,
    });
    await container.repositories.vehicleRepo.save(vehicleA);

    // Bob's Vehicle
    const vehicleB = new Vehicle({
      id: 'veh_bob_01',
      customerId: customerB,
      vin: VinNumber.fromString('1HGCR2F83HA000002'),
      plate: UaePlate.create('Abu Dhabi', '1', '99999'),
      make: 'Mercedes-Benz',
      model: 'G63 AMG',
      year: 2023,
      color: 'Obsidian Black',
      odometerReadingKm: 18000,
    });
    await container.repositories.vehicleRepo.save(vehicleB);

    // Bob's Job
    const jobB = new Job({
      id: 'job_bob_01',
      customerId: customerB,
      vehicleId: vehicleB.id,
      stage: 'intake_checkin',
      serviceAdvisorName: 'Tariq Al-Mansoori',
      customerConcern: 'Brake squeal',
      mileageInKm: 18000,
    });
    await container.repositories.jobRepo.save(jobB);

    // Bob's Estimate
    const estimateB = new Estimate({
      id: 'est_bob_01',
      jobId: jobB.id,
      customerId: customerB,
      items: [
        {
          id: 'item_pads',
          type: 'part',
          description: 'Carbon Ceramic Pads',
          quantity: 1,
          unitPrice: MoneyAed.fromAed(1200.0),
          lineTotal: MoneyAed.fromAed(1200.0),
          isMandatory: true,
        },
      ],
      status: 'pending_customer_decision',
    });
    await container.repositories.estimateRepo.save(estimateB);

    return { customerA, customerB, vehicleA, vehicleB, jobB, estimateB };
  };

  await runner.test('Alice can access her own vehicle', async () => {
    const container = createApplicationContainer();
    const { customerA, vehicleA } = await setupMultiTenantData(container);

    const aliceContext = AuthenticatedContextFactory.forCustomer({ customerId: customerA });
    const result = await container.services.vehicleService.getVehicleById(aliceContext, vehicleA.id);
    assertEquals(result.id, vehicleA.id);
    assertEquals(result.customerId, customerA);
  });

  await runner.test("Alice CANNOT view Bob's vehicle (BOLA/IDOR protection throws 403)", async () => {
    const container = createApplicationContainer();
    const { customerA, vehicleB } = await setupMultiTenantData(container);

    const aliceContext = AuthenticatedContextFactory.forCustomer({ customerId: customerA });
    await assertThrows(async () => {
      await container.services.vehicleService.getVehicleById(aliceContext, vehicleB.id);
    }, 'Unauthorized: You do not have permission to access or modify this Vehicle');
  });

  await runner.test("Alice CANNOT view Bob's workshop job (throws 403)", async () => {
    const container = createApplicationContainer();
    const { customerA, jobB } = await setupMultiTenantData(container);

    const aliceContext = AuthenticatedContextFactory.forCustomer({ customerId: customerA });
    await assertThrows(async () => {
      await container.services.jobService.getJobDetails(aliceContext, jobB.id);
    }, 'Unauthorized: You do not have permission to access or modify this Job');
  });

  await runner.test("Alice CANNOT view or approve Bob's estimate (throws 403)", async () => {
    const container = createApplicationContainer();
    const { customerA, estimateB } = await setupMultiTenantData(container);

    const aliceContext = AuthenticatedContextFactory.forCustomer({ customerId: customerA });
    await assertThrows(async () => {
      await container.services.estimateService.getEstimate(aliceContext, estimateB.id);
    }, 'Unauthorized: You do not have permission to access or modify this Estimate');

    await assertThrows(async () => {
      await container.services.estimateService.submitCustomerDecision(aliceContext, {
        estimateId: estimateB.id,
        decisions: [{ itemId: 'item_pads', decision: 'approved' }],
      });
    }, 'Unauthorized: You do not have permission to access or modify this Estimate');
  });

  await runner.test('Customer CANNOT advance workshop job stages (Privilege Separation throws 403)', async () => {
    const container = createApplicationContainer();
    const { customerB, jobB } = await setupMultiTenantData(container);

    const bobContext = AuthenticatedContextFactory.forCustomer({ customerId: customerB });
    await assertThrows(async () => {
      await container.services.jobService.advanceJobStage(bobContext, jobB.id, 'inspection_in_progress');
    }, 'Staff authorization is required for this operation');
  });

  await runner.test('Authorized Staff CAN view customer records and advance workshop job stages', async () => {
    const container = createApplicationContainer();
    const { jobB } = await setupMultiTenantData(container);

    const staffContext = AuthenticatedContextFactory.forStaff({
      roles: ['advisor', 'workshop_manager'],
      staffId: 'staff_tariq',
    });

    const advanced = await container.services.jobService.advanceJobStage(
      staffContext,
      jobB.id,
      'inspection_in_progress'
    );
    assertEquals(advanced.stage, 'inspection_in_progress');
  });
}
