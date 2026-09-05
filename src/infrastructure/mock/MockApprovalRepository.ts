import { IApprovalRepository } from '../../domain/repositories/IApprovalRepository.ts';
import { IEstimateRepository } from '../../domain/repositories/IEstimateRepository.ts';
import { ApprovalRecord } from '../../domain/entities/ApprovalRecord.ts';
import { Estimate } from '../../domain/entities/Estimate.ts';
import { ApprovalId, CustomerId, EstimateId } from '../../domain/types.ts';

export class MockApprovalRepository implements IApprovalRepository {
  private readonly store = new Map<ApprovalId, ApprovalRecord>();

  constructor(private readonly estimateRepo?: IEstimateRepository) {}

  public async findById(id: ApprovalId): Promise<ApprovalRecord | null> {
    return this.store.get(id) || null;
  }

  public async findByEstimateId(estimateId: EstimateId): Promise<ApprovalRecord | null> {
    for (const a of this.store.values()) {
      if (a.estimateId === estimateId) {
        return a;
      }
    }
    return null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<ApprovalRecord[]> {
    const results: ApprovalRecord[] = [];
    for (const a of this.store.values()) {
      if (a.customerId === customerId) {
        results.push(a);
      }
    }
    return results;
  }

  public async save(record: ApprovalRecord): Promise<void> {
    this.store.set(record.id, record);
  }

  public async saveAtomicWithEstimate(record: ApprovalRecord, estimate: Estimate): Promise<void> {
    // Concurrency Check: Ensure an ApprovalRecord does not already exist for this estimate
    for (const existing of this.store.values()) {
      if (existing.estimateId === record.estimateId) {
        throw new Error(
          `CONCURRENCY_CONFLICT: An ApprovalRecord (${existing.id}) already exists for Estimate ${record.estimateId}. Duplicate decision rejected.`
        );
      }
    }

    if (this.estimateRepo) {
      await this.estimateRepo.update(estimate);
    }

    this.store.set(record.id, record);
  }

  public clear(): void {
    this.store.clear();
  }
}
