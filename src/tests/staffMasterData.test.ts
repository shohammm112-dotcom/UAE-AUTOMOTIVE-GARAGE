import { TestRunner } from './testUtils.ts';
import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Customer } from '../domain/entities/Customer.ts';
import { Vehicle } from '../domain/entities/Vehicle.ts';
import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../domain/valueObjects/UaePlate.ts';
import { Job } from '../domain/entities/Job.ts';

export async function runStaffMasterDataTests(runner: TestRunner) {
  const container = createApplicationContainer({ mode: 'mock' });

  // Seed data
  const customer = new Customer({
    id: 'cust_123',
    authProviderId: 'auth_123',
    authProviderType: 'mock',
    email: 'test@example.com',
    fullName: 'Test Customer',
    phone: '0501234567',
    emirate: 'Dubai'
  });
  await container.repositories.customerRepo.save(customer);

  const vehicle = new Vehicle({
    id: 'veh_123',
    customerId: 'cust_123',
    vin: VinNumber.fromString('1HGCM82633A000000'),
    plate: UaePlate.create('Dubai', 'A', '12345'),
    make: 'Honda',
    model: 'Accord',
    year: 2020,
    color: 'Black',
    odometerReadingKm: 50000
  });
  await container.repositories.vehicleRepo.save(vehicle);

  const job = new Job({
    id: 'job_123',
    customerId: 'cust_123',
    vehicleId: 'veh_123',
    serviceAdvisorName: 'Advisor',
    customerConcern: 'Noise',
    mileageInKm: 50000
  });
  await container.repositories.jobRepo.save(job);

  await runner.test('Customer cannot access internal customer list', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_123', roles: [], authProviderId: 'auth_123', email: 'test@example.com', requestId: 'req_1' };
    try {
      await container.services.customerService.getAllCustomers(context);
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });


  await runner.test('Customer cannot access internal customer detail', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_123', roles: [], authProviderId: 'auth_123', email: 'test@example.com', requestId: 'req_1' };
    try {
      await container.services.customerService.getCustomerById(context, 'cust_123');
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Customer cannot access internal customer vehicles', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_123', roles: [], authProviderId: 'auth_123', email: 'test@example.com', requestId: 'req_1' };
    try {
      await container.services.vehicleService.listVehiclesForCustomerByStaff(context, 'cust_123');
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Customer cannot access internal vehicle detail', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_123', roles: [], authProviderId: 'auth_123', email: 'test@example.com', requestId: 'req_1' };
    try {
      await container.services.vehicleService.getVehicleByIdForStaff(context, 'veh_123');
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Customer cannot access internal vehicle jobs', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_123', roles: [], authProviderId: 'auth_123', email: 'test@example.com', requestId: 'req_1' };
    try {
      await container.services.jobService.listJobsForVehicleByStaff(context, 'veh_123');
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Customer cannot access internal customer jobs', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_123', roles: [], authProviderId: 'auth_123', email: 'test@example.com', requestId: 'req_1' };
    try {
      await container.services.jobService.listJobsForCustomerByStaff(context, 'cust_123');
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Staff can access internal customer list', async () => {
    const context = { actorType: 'staff' as const, roles: ['advisor'], requestId: 'req_2' };
    const customers = await container.services.customerService.getAllCustomers(context);
    if (customers.length !== 1) throw new Error('Expected 1 customer');
    if (customers[0].id !== 'cust_123') throw new Error('Expected cust_123');
  });

  await runner.test('Staff can access vehicle details', async () => {
    const context = { actorType: 'staff' as const, roles: ['advisor'], requestId: 'req_3' };
    const vehicle = await container.services.vehicleService.getVehicleByIdForStaff(context, 'veh_123');
    if (vehicle.id !== 'veh_123') throw new Error('Expected veh_123');
  });
}
