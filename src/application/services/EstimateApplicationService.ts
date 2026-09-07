import { IEstimateRepository } from '../../domain/repositories/IEstimateRepository.ts';
import { IApprovalRepository } from '../../domain/repositories/IApprovalRepository.ts';
import { IJobRepository } from '../../domain/repositories/IJobRepository.ts';
import { IIdempotencyRepository } from '../../domain/repositories/IIdempotencyRepository.ts';
import { IEventBus, EstimateApprovedEvent, EstimateRejectedEvent } from '../../domain/events/DomainEvent.ts';
import { ApprovalRecord, EstimateSnapshotItem } from '../../domain/entities/ApprovalRecord.ts';
import { Estimate, EstimateItem } from '../../domain/entities/Estimate.ts';
import { EstimateStateMachine } from '../../domain/stateMachines/EstimateStateMachine.ts';
import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import {
  ApprovalSummaryDto,
  CreateEstimateDto,
  EstimateResponseDto,
  SubmitEstimateDecisionDto,
} from '../dto/AppDtos.ts';
import { ConflictError, ResourceNotFoundError, ValidationFailedError } from '../errors/ApplicationError.ts';
import { MoneyAed } from '../../domain/valueObjects/MoneyAed.ts';

export class EstimateApplicationService {
  constructor(
    private readonly estimateRepo: IEstimateRepository,
    private readonly approvalRepo: IApprovalRepository,
    private readonly jobRepo?: IJobRepository,
    private readonly idempotencyRepo?: IIdempotencyRepository,
    private readonly eventBus?: IEventBus
  ) {}

  public async getEstimate(
    context: AuthenticatedContext,
    estimateId: string
  ): Promise<EstimateResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const estimate = await this.estimateRepo.findById(estimateId);
    if (!estimate) {
      throw new ResourceNotFoundError('Estimate', estimateId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, estimate.customerId, 'Estimate');
    return this.toDto(estimate);
  }

  /**
   * Lists the authenticated customer's own estimates.
   *
   * Previously absent, which left the customer estimates page a hardcoded stub showing an
   * "API GAP: Endpoint Missing" banner — a customer could only reach an estimate by typing its
   * raw id into the URL. `IEstimateRepository.findByCustomerId` already existed; only the
   * service method and route were missing.
   *
   * Scoped strictly to the caller's own customerId, so it cannot be used to enumerate others.
   */
  public async listEstimatesForCustomer(
    context: AuthenticatedContext
  ): Promise<EstimateResponseDto[]> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) return [];

    const estimates = await this.estimateRepo.findByCustomerId(context.customerId);
    return estimates.map((e) => this.toDto(e));
  }

  public async getLatestEstimateForJob(
    context: AuthenticatedContext,
    jobId: string
  ): Promise<EstimateResponseDto | null> {
    AuthorizationGuard.assertAuthenticated(context);

    const estimate = await this.estimateRepo.findLatestByJobId(jobId);
    if (!estimate) return null;

    AuthorizationGuard.assertCustomerOwnsEntity(context, estimate.customerId, 'Estimate');
    return this.toDto(estimate);
  }

  public async getAllEstimates(context: AuthenticatedContext): Promise<EstimateResponseDto[]> {
    AuthorizationGuard.assertStaffRole(context, ["admin", "workshop_manager", "service_advisor", "advisor", "technician", "mechanic"]);
    const estimates = await this.estimateRepo.listAll();
    return estimates.map((e) => this.toDto(e));
  }

  /**
   * Returns the customer's approval record for an estimate, so commercial staff can raise the
   * invoice that derives from it.
   *
   * Invoice generation requires an approvalId, but approvals were previously not exposed over
   * HTTP at all — the id existed only inside a domain event, leaving the staff invoice screen
   * asking for a value nothing in the product could supply.
   *
   * Read-only, and scoped to the commercial staff set that may already generate invoices and
   * record payments; technicians and mechanics are excluded, matching commercialStaffGuard.
   */
  public async getApprovalForEstimate(
    context: AuthenticatedContext,
    estimateId: string
  ): Promise<ApprovalSummaryDto> {
    AuthorizationGuard.assertStaffRole(context, [
      'admin',
      'workshop_manager',
      'service_advisor',
      'advisor',
    ]);

    const approval = await this.approvalRepo.findByEstimateId(estimateId);
    if (!approval) {
      throw new ResourceNotFoundError('Approval for estimate', estimateId);
    }

    return {
      approvalId: approval.id,
      estimateId: approval.estimateId,
      estimateVersion: approval.estimateVersion,
      customerId: approval.customerId,
      approvedItemIds: [...approval.approvedItemIds],
      rejectedItemIds: [...approval.rejectedItemIds],
      approvedSubtotalFils: approval.approvedSubtotalFils,
      approvedVatFils: approval.approvedVatFils,
      approvedTotalFils: approval.approvedTotalFils,
      approvedTotalDisplay: MoneyAed.fromFils(approval.approvedTotalFils).toDisplayString(),
      serverTimestamp: approval.serverTimestamp,
    };
  }

  /**
   * Creates a draft estimate through the application service layer (SEC-HIGH-04 remediation).
   * Enforces staff authorization and validates job association.
   */
  public async createDraftEstimate(
    context: AuthenticatedContext,
    dto: CreateEstimateDto
  ): Promise<EstimateResponseDto> {
    AuthorizationGuard.assertStaffRole(context, ['advisor', 'service_advisor', 'workshop_manager', 'admin']);

    if (!dto.jobId || !dto.customerId || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new ValidationFailedError('jobId, customerId, and non-empty items array are required');
    }

    if (this.jobRepo) {
      const job = await this.jobRepo.findById(dto.jobId);
      if (!job) {
        throw new ResourceNotFoundError('Job', dto.jobId);
      }
      if (job.customerId !== dto.customerId) {
        throw new ValidationFailedError(`Job ${dto.jobId} does not belong to customer ${dto.customerId}`);
      }
    }

    const estimateId = `est_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedItems: EstimateItem[] = dto.items.map((i, idx) => {
      if (!i.description || i.description.trim().length === 0) {
        throw new ValidationFailedError(`Item ${idx + 1} must have a non-empty description`);
      }
      const qty = Number(i.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new ValidationFailedError(`Item ${idx + 1} quantity must be a positive number`);
      }
      const unitFils = Number(i.unitPriceFils);
      if (isNaN(unitFils) || unitFils < 0) {
        throw new ValidationFailedError(`Item ${idx + 1} unitPriceFils must be a non-negative number`);
      }

      return {
        id: i.id || `item_${idx + 1}`,
        type: i.type || 'part',
        description: i.description.trim(),
        quantity: qty,
        unitPrice: MoneyAed.fromFils(unitFils),
        lineTotal: MoneyAed.fromFils(unitFils * qty),
        isMandatory: Boolean(i.isMandatory),
      };
    });

    const estimate = new Estimate({
      id: estimateId,
      jobId: dto.jobId,
      customerId: dto.customerId,
      status: 'draft',
      items: parsedItems,
    });

    await this.estimateRepo.save(estimate);
    return this.toDto(estimate);
  }

  /**
   * Submits a draft estimate to the customer for review (SEC-HIGH-04 remediation).
   * Transitions status from draft to pending_customer_decision.
   */
  public async submitEstimateToCustomer(
    context: AuthenticatedContext,
    estimateId: string
  ): Promise<EstimateResponseDto> {
    AuthorizationGuard.assertStaffRole(context, ['advisor', 'service_advisor', 'workshop_manager', 'admin']);

    const estimate = await this.estimateRepo.findById(estimateId);
    if (!estimate) {
      throw new ResourceNotFoundError('Estimate', estimateId);
    }

    estimate.submitToCustomer();
    await this.estimateRepo.update(estimate);
    return this.toDto(estimate);
  }

  /**
   * Authoritative customer decision submission.
   * Remediates SEC-HIGH-01 (Strictly customer-only, no staff bypass).
   * Remediates SEC-HIGH-02 (Transactional concurrency protection against race conditions).
   * Remediates SEC-HIGH-03 (Real idempotency key deduplication with payload hashing).
   */
  public async submitCustomerDecision(
    context: AuthenticatedContext,
    dto: SubmitEstimateDecisionDto
  ): Promise<EstimateResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const estimate = await this.estimateRepo.findById(dto.estimateId);
    if (!estimate) {
      throw new ResourceNotFoundError('Estimate', dto.estimateId);
    }

    // SEC-HIGH-01: Strictly enforce customer-only execution (staff cannot submit decisions on customer behalf)
    AuthorizationGuard.assertCustomerOnly(context, estimate.customerId, 'Estimate');

    if (!context.customerId) {
      throw new ValidationFailedError('CustomerId is required to approve or reject an estimate');
    }

    // SEC-HIGH-03: Real Idempotency Key Handling
    const idempotencyKey = dto.idempotencyKey?.trim();
    let payloadHash = '';
    if (idempotencyKey) {
      payloadHash = JSON.stringify({
        estimateId: dto.estimateId,
        decisions: [...dto.decisions].sort((a, b) => a.itemId.localeCompare(b.itemId)),
      });

      if (this.idempotencyRepo) {
        const existingRecord = await this.idempotencyRepo.findByKey(
          context.customerId,
          'submit_estimate_decision',
          idempotencyKey
        );

        if (existingRecord) {
          if (existingRecord.requestPayloadHash !== payloadHash) {
            throw new ConflictError(
              `Idempotency key "${idempotencyKey}" was previously used with different parameters.`
            );
          }
          if (existingRecord.status === 'in_progress') {
            throw new ConflictError(
              `A request with idempotency key "${idempotencyKey}" is currently in progress.`
            );
          }
          if (existingRecord.status === 'completed' && existingRecord.responseBody) {
            return existingRecord.responseBody as EstimateResponseDto;
          }
        }

        await this.idempotencyRepo.save({
          key: idempotencyKey,
          customerId: context.customerId,
          operation: 'submit_estimate_decision',
          requestPayloadHash: payloadHash,
          status: 'in_progress',
          responseStatusCode: 200,
          responseBody: null,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // Idempotency fallback check: If already locked and decided, return existing state
    if (EstimateStateMachine.isImmutable(estimate.status)) {
      const existingApproval = await this.approvalRepo.findByEstimateId(estimate.id);
      if (existingApproval) {
        const dtoResult = this.toDto(estimate);
        if (idempotencyKey && this.idempotencyRepo) {
          await this.idempotencyRepo.update({
            key: idempotencyKey,
            customerId: context.customerId,
            operation: 'submit_estimate_decision',
            requestPayloadHash: payloadHash,
            status: 'completed',
            responseStatusCode: 200,
            responseBody: dtoResult,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        return dtoResult;
      }
      throw new ConflictError(
        `Estimate ${estimate.id} is already in state "${estimate.status}" and cannot accept further decisions.`
      );
    }

    if (!EstimateStateMachine.isActionableByCustomer(estimate.status)) {
      throw new ConflictError(
        `Estimate ${estimate.id} is not pending customer decision (current status: ${estimate.status})`
      );
    }

    if (!dto.decisions || dto.decisions.length === 0) {
      throw new ValidationFailedError('Decision list cannot be empty');
    }

    // Validate that all item IDs match canonical items, that no item is decided
    // twice, and that every decision is a legal literal.
    //
    // Duplicates matter because the two consumers below disagree on how to resolve
    // them: the snapshot builder takes the FIRST match while
    // Estimate.applyCustomerDecision builds a Map and therefore takes the LAST.
    // A payload naming one item twice with opposing decisions produced an approval
    // record, and a downstream tax invoice, whose line items contradicted their own
    // totals.
    //
    // The decision literal matters because nothing downstream validated it: the
    // domain treats any value other than 'approved' as a rejection, so a typo or a
    // missing field silently rejected the line. Combined with the unconditional
    // lock, that terminally destroyed the estimate at zero approved value with no
    // supersession path to recover it.
    const canonicalItemIds = new Set(estimate.items.map((i) => i.id));
    const seenItemIds = new Set<string>();
    for (const d of dto.decisions) {
      if (!canonicalItemIds.has(d.itemId)) {
        throw new ValidationFailedError(
          `Item ID "${d.itemId}" does not exist on Estimate ${estimate.id}`
        );
      }
      if (d.decision !== 'approved' && d.decision !== 'rejected') {
        throw new ValidationFailedError(
          `Invalid decision "${d.decision}" for item "${d.itemId}" on Estimate ${estimate.id}. ` +
            `Expected "approved" or "rejected".`
        );
      }
      if (seenItemIds.has(d.itemId)) {
        throw new ValidationFailedError(
          `Duplicate decision submitted for item "${d.itemId}" on Estimate ${estimate.id}`
        );
      }
      seenItemIds.add(d.itemId);
    }

    // Mandatory items check: If an item is safety-critical / mandatory, customer cannot reject it without acknowledgement
    for (const item of estimate.items) {
      const dec = dto.decisions.find((d) => d.itemId === item.id);
      if (!dec) {
        throw new ValidationFailedError(`Missing decision for estimate item "${item.description}"`);
      }
    }

    // Build canonical snapshot items
    const snapshotItems: EstimateSnapshotItem[] = estimate.items.map((item) => {
      const decision = dto.decisions.find((d) => d.itemId === item.id)!;
      return {
        itemId: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unitPriceFils: item.unitPrice.amountFils,
        lineTotalFils: item.lineTotal.amountFils,
        isMandatory: item.isMandatory,
        approved: decision.decision === 'approved',
        customerRejectionReason: decision.reason,
      };
    });

    const approvedItemIds = snapshotItems.filter((i) => i.approved).map((i) => i.itemId);
    const rejectedItemIds = snapshotItems.filter((i) => !i.approved).map((i) => i.itemId);

    // Apply decision to the estimate entity (calculates totals and locks it permanently)
    const { targetStatus, approvedTotal } = estimate.applyCustomerDecision(
      dto.decisions.map((d) => ({
        itemId: d.itemId,
        decision: d.decision,
        reason: d.reason,
      }))
    );

    // Create immutable audit record
    const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const approvalRecord = new ApprovalRecord({
      id: approvalId,
      estimateId: estimate.id,
      estimateVersion: estimate.version,
      customerId: context.customerId,
      authenticatedProviderUid: context.authenticatedProviderUid || 'provider_uid_mock',
      approvedItemIds,
      rejectedItemIds,
      lineItemsSnapshot: snapshotItems,
      approvedSubtotalFils: estimate.approvedSubtotal.amountFils,
      approvedVatFils: estimate.approvedVat.amountFils,
      approvedTotalFils: approvedTotal.amountFils,
      idempotencyKey,
      serverTimestamp: new Date().toISOString(),
      serverRecordedIp: context.ipAddress || '127.0.0.1',
      userAgent: context.userAgent || 'App/1.0',
    });

    // Atomically persist approval record and locked estimate inside transaction (SEC-HIGH-02)
    try {
      if (typeof this.approvalRepo.saveAtomicWithEstimate === 'function') {
        await this.approvalRepo.saveAtomicWithEstimate(approvalRecord, estimate);
      } else {
        await this.approvalRepo.save(approvalRecord);
        await this.estimateRepo.update(estimate);
      }
    } catch (err: any) {
      if (idempotencyKey && this.idempotencyRepo) {
        await this.idempotencyRepo.update({
          key: idempotencyKey,
          customerId: context.customerId,
          operation: 'submit_estimate_decision',
          requestPayloadHash: payloadHash,
          status: 'failed',
          responseStatusCode: 409,
          responseBody: { error: err.message },
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      if (err.message && err.message.includes('CONCURRENCY_CONFLICT')) {
        throw new ConflictError(err.message);
      }
      throw err;
    }

    // Dispatch lightweight domain events
    if (this.eventBus) {
      if (targetStatus === 'approved' || targetStatus === 'partially_approved') {
        await this.eventBus.publish(
          new EstimateApprovedEvent({
            estimateId: estimate.id,
            approvalId: approvalRecord.id,
            customerId: context.customerId,
            approvedTotalFils: approvedTotal.amountFils,
          })
        );
      } else {
        await this.eventBus.publish(
          new EstimateRejectedEvent({
            estimateId: estimate.id,
            customerId: context.customerId,
          })
        );
      }
    }

    const resultDto = this.toDto(estimate);

    if (idempotencyKey && this.idempotencyRepo) {
      await this.idempotencyRepo.update({
        key: idempotencyKey,
        customerId: context.customerId,
        operation: 'submit_estimate_decision',
        requestPayloadHash: payloadHash,
        status: 'completed',
        responseStatusCode: 200,
        responseBody: resultDto,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return resultDto;
  }

  private toDto(e: Estimate): EstimateResponseDto {
    return {
      id: e.id,
      jobId: e.jobId,
      customerId: e.customerId,
      version: e.version,
      parentEstimateId: e.parentEstimateId,
      status: e.status,
      items: e.items.map((i) => ({
        id: i.id,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unitPriceFils: i.unitPrice.amountFils,
        lineTotalFils: i.lineTotal.amountFils,
        unitPriceDisplay: i.unitPrice.toDisplayString(),
        lineTotalDisplay: i.lineTotal.toDisplayString(),
        isMandatory: i.isMandatory,
        decision: i.decision,
        customerRejectionReason: i.customerRejectionReason,
      })),
      subtotalFils: e.subtotal.amountFils,
      vatFils: e.vat.amountFils,
      totalFils: e.total.amountFils,
      subtotalDisplay: e.subtotal.toDisplayString(),
      vatDisplay: e.vat.toDisplayString(),
      totalDisplay: e.total.toDisplayString(),
      approvedTotalFils: e.approvedTotal.amountFils,
      approvedTotalDisplay: e.approvedTotal.toDisplayString(),
      isActionable: EstimateStateMachine.isActionableByCustomer(e.status),
      isLocked: EstimateStateMachine.isImmutable(e.status),
      createdAt: e.createdAt,
      lockedAt: e.lockedAt,
    };
  }
}
