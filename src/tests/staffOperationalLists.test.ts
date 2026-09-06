import { TestRunner } from './testUtils.ts';
import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Customer } from '../domain/entities/Customer.ts';
import { Vehicle } from '../domain/entities/Vehicle.ts';
import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../domain/valueObjects/UaePlate.ts';
import { Job } from '../domain/entities/Job.ts';
import { Estimate } from '../domain/entities/Estimate.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { Invoice } from '../domain/entities/Invoice.ts';

export async function runStaffOperationalListsTests(runner: TestRunner) {
  const container = createApplicationContainer({ mode: 'mock' });

  // Seed data
  const customer = new Customer({
    id: 'cust_ops',
    authProviderId: 'auth_ops',
    authProviderType: 'mock',
    email: 'ops@example.com',
    fullName: 'Ops Customer',
    phone: '0501111111',
    emirate: 'Dubai'
  });
  await container.repositories.customerRepo.save(customer);

  const vehicle = new Vehicle({
    id: 'veh_ops',
    customerId: 'cust_ops',
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
    id: 'job_ops',
    customerId: 'cust_ops',
    vehicleId: 'veh_ops',
    serviceAdvisorName: 'Advisor',
    customerConcern: 'Noise',
    mileageInKm: 50000
  });
  await container.repositories.jobRepo.save(job);

  const estimate = new Estimate({
    id: 'est_ops',
    jobId: 'job_ops',
    customerId: 'cust_ops',
    items: [
      { id: 'item_1', type: 'labor', description: 'Labor', quantity: 1, unitPrice: MoneyAed.fromFils(100), lineTotal: MoneyAed.fromFils(100), isMandatory: true }
    ],
    version: 1,
    status: 'draft',
    parentEstimateId: undefined,
  });
  await container.repositories.estimateRepo.save(estimate);

  const invoice = new Invoice({
    id: 'inv_ops',
    jobId: 'job_ops',
    customerId: 'cust_ops',
    estimateId: 'est_ops',
    approvalId: 'appr_ops',
    estimateVersion: 1,
    status: 'issued',
    subtotal: MoneyAed.fromFils(100),
    vat: MoneyAed.fromFils(5),
    total: MoneyAed.fromFils(105),
    issuedAt: new Date().toISOString()
  });
  await container.repositories.invoiceRepo.save(invoice);


  await runner.test('Customer cannot access internal jobs list', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_ops', roles: [], authProviderId: 'auth_ops', email: 'ops@example.com', requestId: 'req_1' };
    try {
      await container.services.jobService.getAllJobs(context);
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Staff can access internal jobs list', async () => {
    const context = { actorType: 'staff' as const, roles: ['advisor'], requestId: 'req_2' };
    const jobs = await container.services.jobService.getAllJobs(context);
    if (jobs.length !== 1 || jobs[0].id !== 'job_ops') throw new Error('Expected job_ops');
  });

  await runner.test('Customer cannot access internal estimates list', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_ops', roles: [], authProviderId: 'auth_ops', email: 'ops@example.com', requestId: 'req_1' };
    try {
      await container.services.estimateService.getAllEstimates(context);
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Staff can access internal estimates list', async () => {
    const context = { actorType: 'staff' as const, roles: ['advisor'], requestId: 'req_2' };
    const estimates = await container.services.estimateService.getAllEstimates(context);
    if (estimates.length !== 1 || estimates[0].id !== 'est_ops') throw new Error('Expected est_ops');
  });

  await runner.test('Customer cannot access internal invoices list', async () => {
    const context = { actorType: 'customer' as const, customerId: 'cust_ops', roles: [], authProviderId: 'auth_ops', email: 'ops@example.com', requestId: 'req_1' };
    try {
      await container.services.invoiceService.getAllInvoices(context);
      throw new Error('Should have thrown 403');
    } catch (e: any) {
      if (e.statusCode !== 403) throw e;
    }
  });

  await runner.test('Staff can access internal invoices list', async () => {
    const context = { actorType: 'staff' as const, roles: ['advisor'], requestId: 'req_2' };
    const invoices = await container.services.invoiceService.getAllInvoices(context);
    if (invoices.length !== 1 || invoices[0].id !== 'inv_ops') throw new Error('Expected inv_ops');
  });
}
