import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Estimate, EstimateItem } from '../domain/entities/Estimate.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { AuthenticatedContextFactory } from '../application/security/AuthenticatedContext.ts';
import { assertEquals, assertThrows, TestRunner } from './testUtils.ts';

export async function runInvoiceDerivationTests(runner: TestRunner): Promise<void> {
  runner.suite('Application Service: Invoice Derivation from Canonical Approval', () => {});

  const setupApprovedEstimate = async (container: ReturnType<typeof createApplicationContainer>) => {
    const customerId = 'cust_vip_01';
    const otherCustomerId = 'cust_intruder_02';
    const jobId = 'job_supercar_01';
    const estimateId = 'est_supercar_01';

    const items: EstimateItem[] = [
      {
        id: 'item_major_service',
        type: 'labor',
        description: 'Major Inspection & Service Package',
        quantity: 1,
        unitPrice: MoneyAed.fromAed(2000.0), // 200,000 fils
        lineTotal: MoneyAed.fromAed(2000.0),
        isMandatory: true,
      },
      {
        id: 'item_spark_plugs',
        type: 'part',
        description: 'Iridium Spark Plugs Set',
        quantity: 8,
        unitPrice: MoneyAed.fromAed(125.0), // 12,500 fils each -> 100,000 fils (1,000 AED)
        lineTotal: MoneyAed.fromAed(1000.0),
        isMandatory: true,
      },
    ];

    const estimate = new Estimate({
      id: estimateId,
      jobId,
      customerId,
      items,
      status: 'pending_customer_decision',
    });
    await container.repositories.estimateRepo.save(estimate);

    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });
    await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      decisions: [
        { itemId: 'item_major_service', decision: 'approved' },
        { itemId: 'item_spark_plugs', decision: 'approved' },
      ],
    });

    const approval = await container.repositories.approvalRepo.findByEstimateId(estimateId);
    return { customerId, otherCustomerId, jobId, estimateId, approval: approval! };
  };

  await runner.test('Customer CANNOT directly issue an invoice (throws 403)', async () => {
    const container = createApplicationContainer();
    const { customerId, approval } = await setupApprovedEstimate(container);

    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });
    await assertThrows(async () => {
      await container.services.invoiceService.generateInvoiceFromApproval(customerContext, approval.id);
    }, 'Staff authorization is required for this operation');
  });

  await runner.test('Staff can generate Invoice derived deterministically from ApprovalRecord', async () => {
    const container = createApplicationContainer();
    const { customerId, approval } = await setupApprovedEstimate(container);

    const staffContext = AuthenticatedContextFactory.forStaff({
      roles: ['advisor', 'admin'],
      staffId: 'staff_finance_01',
    });

    const invoice = await container.services.invoiceService.generateInvoiceFromApproval(
      staffContext,
      approval.id
    );

    // Subtotal: 3,000 AED = 300,000 fils
    // VAT (5%): 150 AED = 15,000 fils
    // Total: 3,150 AED = 315,000 fils
    assertEquals(invoice.customerId, customerId);
    assertEquals(invoice.subtotalFils, 300000);
    assertEquals(invoice.vatFils, 15000);
    assertEquals(invoice.totalFils, 315000);
    assertEquals(invoice.totalDisplay, 'AED 3,150.00');
    assertEquals(invoice.status, 'issued');

    // Customer can view their invoice
    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });
    const fetched = await container.services.invoiceService.getInvoiceById(customerContext, invoice.id);
    assertEquals(fetched.id, invoice.id);
  });

  await runner.test("Other customer CANNOT view Customer's Invoice (throws 403)", async () => {
    const container = createApplicationContainer();
    const { otherCustomerId, approval } = await setupApprovedEstimate(container);

    const staffContext = AuthenticatedContextFactory.forStaff({ roles: ['admin'] });
    const invoice = await container.services.invoiceService.generateInvoiceFromApproval(
      staffContext,
      approval.id
    );

    const intruderContext = AuthenticatedContextFactory.forCustomer({ customerId: otherCustomerId });
    await assertThrows(async () => {
      await container.services.invoiceService.getInvoiceById(intruderContext, invoice.id);
    }, 'Unauthorized: You do not have permission to access or modify this Invoice');
  });

  await runner.test('Staff can record payment and mark invoice paid', async () => {
    const container = createApplicationContainer();
    const { approval } = await setupApprovedEstimate(container);

    const staffContext = AuthenticatedContextFactory.forStaff({ roles: ['advisor'] });
    const invoice = await container.services.invoiceService.generateInvoiceFromApproval(
      staffContext,
      approval.id
    );

    const paidInvoice = await container.services.invoiceService.recordPayment(
      staffContext,
      invoice.id,
      'card_online'
    );
    assertEquals(paidInvoice.status, 'paid');
    assertEquals(paidInvoice.paymentMethod, 'card_online');
  });

  await runner.test('SEC-CRIT-01: Sequential duplicate invoice generation returns identical invoice idempotently', async () => {
    const container = createApplicationContainer();
    const { approval } = await setupApprovedEstimate(container);

    const staffContext = AuthenticatedContextFactory.forStaff({ roles: ['advisor', 'admin'] });
    const invoice1 = await container.services.invoiceService.generateInvoiceFromApproval(staffContext, approval.id);
    const invoice2 = await container.services.invoiceService.generateInvoiceFromApproval(staffContext, approval.id);

    assertEquals(invoice1.id, invoice2.id);
    assertEquals(invoice1.totalFils, invoice2.totalFils);

    // Verify datastore contains exactly one invoice for this approval
    const foundInvoice = await container.repositories.invoiceRepo.findByApprovalId(approval.id);
    assertEquals(foundInvoice?.id, invoice1.id);
  });

  await runner.test('SEC-CRIT-01: Concurrent duplicate invoice generation returns identical invoice without duplication', async () => {
    const container = createApplicationContainer();
    const { approval } = await setupApprovedEstimate(container);

    const staffContext = AuthenticatedContextFactory.forStaff({ roles: ['advisor', 'admin'] });

    // Simulate two concurrent requests hitting generateInvoiceFromApproval simultaneously
    const [inv1, inv2] = await Promise.all([
      container.services.invoiceService.generateInvoiceFromApproval(staffContext, approval.id),
      container.services.invoiceService.generateInvoiceFromApproval(staffContext, approval.id),
    ]);

    assertEquals(inv1.id, inv2.id);
    assertEquals(inv1.totalFils, inv2.totalFils);

    const foundInvoice = await container.repositories.invoiceRepo.findByApprovalId(approval.id);
    assertEquals(foundInvoice?.id, inv1.id);
  });

  await runner.test('SEC-STAFF-GRANULARITY: Technicians and mechanics cannot generate invoices or record payment', async () => {
    const container = createApplicationContainer();
    const { approval } = await setupApprovedEstimate(container);

    const technicianContext = AuthenticatedContextFactory.forStaff({ roles: ['technician'] });
    const mechanicContext = AuthenticatedContextFactory.forStaff({ roles: ['mechanic'] });

    await assertThrows(async () => {
      await container.services.invoiceService.generateInvoiceFromApproval(technicianContext, approval.id);
    }, 'Requires one of: advisor, service_advisor, workshop_manager, admin');

    await assertThrows(async () => {
      await container.services.invoiceService.generateInvoiceFromApproval(mechanicContext, approval.id);
    }, 'Requires one of: advisor, service_advisor, workshop_manager, admin');
  });
}
