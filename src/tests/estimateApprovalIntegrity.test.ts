import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Estimate, EstimateItem } from '../domain/entities/Estimate.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { AuthenticatedContextFactory } from '../application/security/AuthenticatedContext.ts';
import type { EstimateResponseDto } from '../application/dto/AppDtos.ts';
import type { EstimateStatus } from '../domain/stateMachines/EstimateStateMachine.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

/**
 * Regression suite for the customer estimate-approval defect.
 *
 * Historical failure condition: EstimateDetailPage gated every customer action on
 * `status === 'draft' || status === 'pending'`. 'pending' is not a member of
 * EstimateStatus, so the gate was false for every genuinely actionable estimate -
 * the approve/reject controls and the submit button were never rendered, the page
 * told the customer the estimate was "locked", and it labelled every line item
 * "Approved". The server had computed the correct answer all along and shipped it
 * as EstimateResponseDto.isActionable, which the page ignored.
 *
 * It survived Step 5.6 because EstimateResponseDto.status was typed as a bare
 * `string` while its sibling JobResponseDto.stage had been narrowed to JobStage -
 * so `=== 'pending'` was invisible to tsc.
 */

const SRC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * COMPILE-TIME GUARD. If EstimateResponseDto.status ever widens back to `string`,
 * `'pending' extends string` becomes true, this type resolves to 'WIDE', and the
 * assignment below is a compile error. Verified to fail (TS2322) when the field
 * is reverted to `string`.
 */
type EstimateStatusNarrowness = 'pending' extends EstimateResponseDto['status'] ? 'WIDE' : 'NARROW';
const STATUS_NARROWNESS: EstimateStatusNarrowness = 'NARROW';

/** Every status literal any domain state machine can legitimately produce. */
const ALL_DOMAIN_STATUSES = new Set<string>([
  // EstimateStatus
  'draft', 'pending_customer_decision', 'partially_approved', 'approved', 'rejected', 'locked',
  // InvoiceStatus
  'issued', 'paid', 'void',
  // AppointmentStatus
  'requested', 'confirmed', 'cancelled', 'completed', 'no_show',
]);

/**
 * Strips comments so the guards below cannot be satisfied by prose. An earlier
 * draft of this suite was defeated twice: once because `(x.status as string) ===`
 * put a cast between the property and the operator, and once because the word
 * "isActionable" appeared in an explanatory comment while the code no longer used
 * it. Both bypasses are re-run against the current version in the adversarial pass.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

/**
 * Directory walk, not an allowlist - a page added tomorrow is covered automatically.
 */
function walkSources(...roots: string[]): string[] {
  const found: string[] = [];
  const visit = (absDir: string): void => {
    for (const entry of readdirSync(absDir, { withFileTypes: true })) {
      const abs = join(absDir, entry.name);
      if (entry.isDirectory()) visit(abs);
      else if (/\.tsx?$/.test(entry.name)) found.push(relative(SRC_ROOT, abs));
    }
  };
  for (const root of roots) {
    const abs = resolve(SRC_ROOT, root);
    if (existsSync(abs)) visit(abs);
  }
  return found.sort();
}

const AUTHORITATIVE_STATUSES: EstimateStatus[] = [
  'draft', 'pending_customer_decision', 'partially_approved', 'approved', 'rejected', 'locked',
];

export async function runEstimateApprovalIntegrityTests(runner: TestRunner): Promise<void> {
  runner.suite('Estimate Approval Integrity (customer decision path)', () => {});

  const buildItems = (): EstimateItem[] => [
    {
      id: 'item_mandatory_brakes',
      type: 'part',
      description: 'OEM Front Brake Discs',
      quantity: 1,
      unitPrice: MoneyAed.fromAed(400.0),
      lineTotal: MoneyAed.fromAed(400.0),
      isMandatory: true,
    },
    {
      id: 'item_optional_filter',
      type: 'part',
      description: 'Cabin Pollen Filter',
      quantity: 1,
      unitPrice: MoneyAed.fromAed(100.0),
      lineTotal: MoneyAed.fromAed(100.0),
      isMandatory: false,
    },
  ];

  const seed = async (
    container: ReturnType<typeof createApplicationContainer>,
    status: EstimateStatus = 'pending_customer_decision'
  ) => {
    const customerId = 'cust_integrity_01';
    const estimateId = `est_integrity_${status}`;
    const estimate = new Estimate({
      id: estimateId,
      jobId: 'job_integrity_01',
      customerId,
      version: 1,
      items: buildItems(),
      status,
    });
    await container.repositories.estimateRepo.save(estimate);
    return { customerId, estimateId };
  };

  const customerCtx = (customerId: string) =>
    AuthenticatedContextFactory.forCustomer({ customerId, ipAddress: '10.0.0.9', userAgent: 'jsdom' });

  // ---------------------------------------------------------------- actionability

  await runner.test('the compile-time narrowness guard is present', () => {
    assertEquals(STATUS_NARROWNESS, 'NARROW');
  });

  await runner.test(
    'REGRESSION: an actionable estimate is actionable, and the historical gate was not',
    async () => {
      const container = createApplicationContainer();
      const { customerId, estimateId } = await seed(container, 'pending_customer_decision');
      const dto = await container.services.estimateService.getEstimate(customerCtx(customerId), estimateId);

      assertEquals(dto.status, 'pending_customer_decision');
      assert(dto.isActionable, 'server must report a pending_customer_decision estimate as actionable');
      assert(!dto.isLocked, 'a pending estimate is not locked');

      // The exact expression the page used to gate on. It evaluated false for
      // every genuinely actionable estimate, which is the whole defect.
      const historicalGate =
        (dto.status as string) === 'draft' || (dto.status as string) === 'pending';
      assertEquals(
        historicalGate,
        false,
        'the historical gate must be demonstrably wrong for an actionable estimate'
      );
    }
  );

  await runner.test('a draft estimate is NOT actionable by the customer', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container, 'draft');
    const dto = await container.services.estimateService.getEstimate(customerCtx(customerId), estimateId);
    assert(!dto.isActionable, 'draft must not be customer-actionable');
    // The historical gate returned TRUE here - it rendered approve controls for an
    // internal draft the server would then reject.
  });

  await runner.test('a locked estimate is not actionable and reports as locked', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container, 'locked');
    const dto = await container.services.estimateService.getEstimate(customerCtx(customerId), estimateId);
    assert(!dto.isActionable);
    assert(dto.isLocked);
  });

  // ---------------------------------------------------------------- input integrity

  await runner.test('duplicate item ids in one decision payload are rejected', async () => {
    // Previously accepted: the snapshot builder resolved duplicates by first match
    // while the domain resolved them by last match, producing an approval record -
    // and a downstream tax invoice - whose line items contradicted its own totals.
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container);
    await assertThrows(
      () =>
        container.services.estimateService.submitCustomerDecision(customerCtx(customerId), {
          estimateId,
          decisions: [
            { itemId: 'item_mandatory_brakes', decision: 'approved' },
            { itemId: 'item_optional_filter', decision: 'approved' },
            { itemId: 'item_optional_filter', decision: 'rejected' },
          ],
        }),
      'Duplicate decision submitted'
    );
  });

  await runner.test('an invalid decision literal is rejected', async () => {
    // Previously accepted: the domain treats anything that is not exactly
    // 'approved' as a rejection, so this silently locked the estimate at zero
    // approved value - terminally, since locked has no supersession path.
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container);
    await assertThrows(
      () =>
        container.services.estimateService.submitCustomerDecision(customerCtx(customerId), {
          estimateId,
          decisions: [
            { itemId: 'item_mandatory_brakes', decision: 'APPROVED' as 'approved' },
            { itemId: 'item_optional_filter', decision: 'approved' },
          ],
        }),
      'Invalid decision'
    );
  });

  await runner.test('a rejected payload leaves the estimate actionable, not destroyed', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container);
    await assertThrows(() =>
      container.services.estimateService.submitCustomerDecision(customerCtx(customerId), {
        estimateId,
        decisions: [
          { itemId: 'item_mandatory_brakes', decision: 'nonsense' as 'approved' },
          { itemId: 'item_optional_filter', decision: 'approved' },
        ],
      })
    );
    const after = await container.services.estimateService.getEstimate(customerCtx(customerId), estimateId);
    assertEquals(after.status, 'pending_customer_decision');
    assert(after.isActionable, 'a rejected malformed payload must not lock the estimate');
  });

  // ---------------------------------------------------------------- security preserved

  await runner.test('another customer cannot approve this estimate', async () => {
    const container = createApplicationContainer();
    const { estimateId } = await seed(container);
    await assertThrows(
      () =>
        container.services.estimateService.submitCustomerDecision(customerCtx('cust_someone_else'), {
          estimateId,
          decisions: [
            { itemId: 'item_mandatory_brakes', decision: 'approved' },
            { itemId: 'item_optional_filter', decision: 'approved' },
          ],
        }),
      'do not have permission'
    );
  });

  await runner.test('a locked estimate rejects a new approval', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container, 'locked');
    await assertThrows(() =>
      container.services.estimateService.submitCustomerDecision(customerCtx(customerId), {
        estimateId,
        decisions: [
          { itemId: 'item_mandatory_brakes', decision: 'approved' },
          { itemId: 'item_optional_filter', decision: 'approved' },
        ],
      })
    );
  });

  await runner.test('replaying the same approval still yields exactly one approval record', async () => {
    const container = createApplicationContainer();
    const { customerId, estimateId } = await seed(container);
    const ctx = customerCtx(customerId);
    const decisions = [
      { itemId: 'item_mandatory_brakes', decision: 'approved' as const },
      { itemId: 'item_optional_filter', decision: 'rejected' as const },
    ];

    const first = await container.services.estimateService.submitCustomerDecision(ctx, { estimateId, decisions });
    assertEquals(first.status, 'locked');
    assertEquals(first.approvedTotalFils, 42000); // 400 AED + 5% VAT

    const replay = await container.services.estimateService.submitCustomerDecision(ctx, { estimateId, decisions });
    assertEquals(replay.approvedTotalFils, 42000, 'replay must not change the sealed totals');

    const approval = await container.repositories.approvalRepo.findByEstimateId(estimateId);
    assert(approval !== null);
    assertEquals(approval!.approvedItemIds.length, 1);
    assertEquals(approval!.rejectedItemIds.length, 1);
  });

  // ---------------------------------------------------------------- drift guard

  await runner.test(
    'no UI module compares a .status against a value no state machine can produce',
    () => {
      const offenders: string[] = [];
      for (const rel of walkSources('app', 'lib', 'components')) {
        const source = stripComments(readFileSync(resolve(SRC_ROOT, rel), 'utf8'));
        // Tolerates an intervening cast and a closing paren, e.g.
        // `(estimate.status as string) === 'pending'`, and matches !== as well.
        for (const match of source.matchAll(
          /status\s*(?:as\s+\w+\s*)?\)?\s*[!=]==\s*['"]([A-Za-z0-9_]+)['"]/g
        )) {
          if (!ALL_DOMAIN_STATUSES.has(match[1])) {
            offenders.push(`${rel}: .status === '${match[1]}'`);
          }
        }
      }
      assertEquals(
        offenders.join(' | '),
        '',
        `UI compares .status against non-domain literal(s): ${offenders.join(' | ')}`
      );
    }
  );

  await runner.test(
    'the customer estimate page consumes the server-computed isActionable',
    () => {
      const page = stripComments(
        readFileSync(resolve(SRC_ROOT, 'app/routes/portal/EstimateDetailPage.tsx'), 'utf8')
      );
      assert(
        /\.isActionable\b/.test(page),
        'EstimateDetailPage must gate on EstimateResponseDto.isActionable, not a hand-rolled status comparison'
      );
    }
  );

  await runner.test('the authoritative EstimateStatus union is unchanged', () => {
    const source = readFileSync(
      resolve(SRC_ROOT, 'domain/stateMachines/EstimateStateMachine.ts'),
      'utf8'
    );
    for (const status of AUTHORITATIVE_STATUSES) {
      assert(source.includes(`'${status}'`), `EstimateStatus lost the '${status}' member`);
    }
    assert(!source.includes("'sent'"), "a 'sent' status was invented in the estimate lifecycle");
    assert(!source.includes("'pending'\n"), "a bare 'pending' status was invented");
  });
}
