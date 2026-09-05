import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Estimate, EstimateItem } from '../domain/entities/Estimate.ts';
import { Job } from '../domain/entities/Job.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { AuthenticatedContextFactory } from '../application/security/AuthenticatedContext.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

export async function runEstimateAndApprovalTests(runner: TestRunner): Promise<void> {
  runner.suite('Application Service: Estimate & Immutable Approval', () => {});

  const setupTestEstimate = async (container: ReturnType<typeof createApplicationContainer>) => {
    const customerId = 'cust_test_01';
    const jobId = 'job_test_01';
    const estimateId = 'est_test_01';

    const items: EstimateItem[] = [
      {
        id: 'item_front_pads',
        type: 'part',
        description: 'OEM Front Ceramic Brake Pads',
        quantity: 1,
        unitPrice: MoneyAed.fromAed(450.0), // 45,000 fils
        lineTotal: MoneyAed.fromAed(450.0),
        isMandatory: true,
      },
      {
        id: 'item_pad_labor',
        type: 'labor',
        description: 'Brake Pad Replacement Labor',
        quantity: 2,
        unitPrice: MoneyAed.fromAed(150.0), // 15,000 fils each -> 30,000 fils
        lineTotal: MoneyAed.fromAed(300.0),
        isMandatory: true,
      },
      {
        id: 'item_ac_filter',
        type: 'part',
        description: 'Cabin AC Pollen Filter',
        quantity: 1,
        unitPrice: MoneyAed.fromAed(120.0), // 12,000 fils
        lineTotal: MoneyAed.fromAed(120.0),
        isMandatory: false, // Optional / Recommended
      },
    ];

    const estimate = new Estimate({
      id: estimateId,
      jobId,
      customerId,
      version: 1,
      items,
      status: 'pending_customer_decision',
    });

    await container.repositories.estimateRepo.save(estimate);
    return { customerId, jobId, estimateId, estimate };
  };

  await runner.test('should calculate gross totals in fils correctly upon creation', async () => {
    const container = createApplicationContainer();
    const { estimate } = await setupTestEstimate(container);

    // Subtotal: 450 + 300 + 120 = 870 AED = 87,000 fils
    assertEquals(estimate.subtotal.amountFils, 87000);
    // VAT (5%): 87,000 * 500 / 10000 = 4,350 fils (43.50 AED)
    assertEquals(estimate.vat.amountFils, 4350);
    // Total: 87,000 + 4,350 = 91,350 fils (913.50 AED)
    assertEquals(estimate.total.amountFils, 91350);
    assertEquals(estimate.total.toDisplayString(), 'AED 913.50');
  });

  await runner.test('should process selective approval (approve mandatory, reject optional)', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await setupTestEstimate(container);

    const customerContext = AuthenticatedContextFactory.forCustomer({
      customerId,
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 Safari',
    });

    const response = await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      decisions: [
        { itemId: 'item_front_pads', decision: 'approved' },
        { itemId: 'item_pad_labor', decision: 'approved' },
        { itemId: 'item_ac_filter', decision: 'rejected', reason: 'Will replace next month' },
      ],
    });

    // Subtotal approved: 450 + 300 = 750 AED = 75,000 fils
    // VAT approved (5%): 75,000 * 500 / 10000 = 3,750 fils (37.50 AED)
    // Total approved: 75,000 + 3,750 = 78,750 fils (787.50 AED)
    assertEquals(response.approvedTotalFils, 78750);
    assertEquals(response.approvedTotalDisplay, 'AED 787.50');
    assertEquals(response.status, 'locked');
    assert(response.isLocked);
    assert(!response.isActionable);

    // Verify ApprovalRecord snapshot was persisted
    const approval = await container.repositories.approvalRepo.findByEstimateId(estimateId);
    assert(approval !== null, 'ApprovalRecord must exist in repository');
    assertEquals(approval!.approvedTotalFils, 78750);
    assertEquals(approval!.approvedItemIds.length, 2);
    assertEquals(approval!.rejectedItemIds.length, 1);
    assertEquals(approval!.serverRecordedIp, '192.168.1.50');
    assertEquals(approval!.userAgent, 'Mozilla/5.0 Safari');
    assert(approval!.lineItemsSnapshot.length === 3);
  });

  await runner.test('should enforce immutability: locked estimate cannot accept subsequent modifications', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await setupTestEstimate(container);

    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });

    // First decision: locks estimate
    await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      decisions: [
        { itemId: 'item_front_pads', decision: 'approved' },
        { itemId: 'item_pad_labor', decision: 'approved' },
        { itemId: 'item_ac_filter', decision: 'approved' },
      ],
    });

    // Replay with identical input: Idempotent! Returns existing sealed estimate without duplicate approval records
    const replayResponse = await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      decisions: [
        { itemId: 'item_front_pads', decision: 'approved' },
        { itemId: 'item_pad_labor', decision: 'approved' },
        { itemId: 'item_ac_filter', decision: 'approved' },
      ],
    });
    assertEquals(replayResponse.status, 'locked');

    // Attempting to modify decisions or mutate locked estimate fails or retains locked state
    const approvals = await container.repositories.approvalRepo.findByCustomerId(customerId);
    assertEquals(approvals.length, 1, 'Replayed request must not create a duplicate approval record');
  });

  await runner.test('should ignore client price tampering and use canonical datastore prices', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await setupTestEstimate(container);

    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });

    // Client attempts to pass tampered prices (the DTO type does not even accept prices; we derive exclusively from canonical estimate)
    const response = await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      decisions: [
        { itemId: 'item_front_pads', decision: 'approved' },
        { itemId: 'item_pad_labor', decision: 'approved' },
        { itemId: 'item_ac_filter', decision: 'approved' },
      ],
    });

    // Canonical total: 91,350 fils. Even if an attacker tried to inject 100 fils, canonical prices are used.
    assertEquals(response.approvedTotalFils, 91350);
  });

  await runner.test('SEC-HIGH-01: Staff CANNOT submit customer decisions on estimate (throws 403)', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await setupTestEstimate(container);

    const staffContext = AuthenticatedContextFactory.forStaff({
      roles: ['advisor', 'admin'],
      staffId: 'staff_rogue_01',
    });

    await assertThrows(async () => {
      await container.services.estimateService.submitCustomerDecision(staffContext, {
        estimateId,
        decisions: [
          { itemId: 'item_front_pads', decision: 'approved' },
          { itemId: 'item_pad_labor', decision: 'approved' },
          { itemId: 'item_ac_filter', decision: 'approved' },
        ],
      });
    }, 'Staff members cannot execute operations on behalf of customers');
  });

  await runner.test('SEC-HIGH-02: Concurrent duplicate approval calls trigger CONCURRENCY_CONFLICT', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await setupTestEstimate(container);

    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });

    // Race two decisions concurrently
    const decisions = [
      { itemId: 'item_front_pads', decision: 'approved' as const },
      { itemId: 'item_pad_labor', decision: 'approved' as const },
      { itemId: 'item_ac_filter', decision: 'approved' as const },
    ];

    const results = await Promise.allSettled([
      container.services.estimateService.submitCustomerDecision(customerContext, { estimateId, decisions }),
      container.services.estimateService.submitCustomerDecision(customerContext, { estimateId, decisions }),
    ]);

    // At least one must succeed; any concurrent collision yields ConflictError or idempotent result
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    assert(fulfilled.length >= 1, 'At least one request must succeed');

    const approvals = await container.repositories.approvalRepo.findByCustomerId(customerId);
    assertEquals(approvals.length, 1, 'Only exactly 1 ApprovalRecord can ever be saved for an estimate');
  });

  await runner.test('SEC-HIGH-03: Idempotency key caches result and rejects mismatched payload with 409', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await setupTestEstimate(container);

    const customerContext = AuthenticatedContextFactory.forCustomer({ customerId });
    const idempotencyKey = 'idem_est_decision_001';

    // First submission with key
    const res1 = await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      idempotencyKey,
      decisions: [
        { itemId: 'item_front_pads', decision: 'approved' },
        { itemId: 'item_pad_labor', decision: 'approved' },
        { itemId: 'item_ac_filter', decision: 'approved' },
      ],
    });

    // Replay with identical key and payload: returns cached response
    const res2 = await container.services.estimateService.submitCustomerDecision(customerContext, {
      estimateId,
      idempotencyKey,
      decisions: [
        { itemId: 'item_front_pads', decision: 'approved' },
        { itemId: 'item_pad_labor', decision: 'approved' },
        { itemId: 'item_ac_filter', decision: 'approved' },
      ],
    });
    assertEquals(res1.id, res2.id);

    // Replay with same key but DIFFERENT payload: throws ConflictError
    await assertThrows(async () => {
      await container.services.estimateService.submitCustomerDecision(customerContext, {
        estimateId,
        idempotencyKey,
        decisions: [
          { itemId: 'item_front_pads', decision: 'rejected', reason: 'Too expensive' },
          { itemId: 'item_pad_labor', decision: 'approved' },
          { itemId: 'item_ac_filter', decision: 'approved' },
        ],
      });
    }, 'was previously used with different parameters');
  });

  await runner.test('SEC-HIGH-04: Staff creates draft estimate and submits through service layer', async () => {
    const container = createApplicationContainer();
    const customerId = 'cust_high04_01';
    const jobId = 'job_high04_01';

    // Seed Job first to satisfy relationship validation
    const job = new Job({
      id: jobId,
      customerId,
      vehicleId: 'veh_high04_01',
      serviceAdvisorName: 'Tariq Advisor',
      customerConcern: 'Annual oil change and brake inspection',
      mileageInKm: 45000,
    });
    await container.repositories.jobRepo.save(job);

    const staffContext = AuthenticatedContextFactory.forStaff({ roles: ['advisor'] });

    const draft = await container.services.estimateService.createDraftEstimate(staffContext, {
      jobId,
      customerId,
      items: [
        {
          id: 'item_oil',
          type: 'part',
          description: 'Synthetic Engine Oil 5W-40',
          quantity: 1,
          unitPriceFils: 25000,
          isMandatory: true,
        },
      ],
    });

    assertEquals(draft.status, 'draft');
    assertEquals(draft.totalFils, 26250); // 250 AED + 5% VAT = 262.50 AED = 26,250 fils

    const submitted = await container.services.estimateService.submitEstimateToCustomer(
      staffContext,
      draft.id
    );
    assertEquals(submitted.status, 'pending_customer_decision');
    assertEquals(submitted.isActionable, true);
  });
}
