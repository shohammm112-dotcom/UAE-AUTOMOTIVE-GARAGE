import { ApprovalRecord } from '../entities/ApprovalRecord.ts';
import { Estimate } from '../entities/Estimate.ts';
import { ApprovalId, CustomerId, EstimateId } from '../types.ts';

export interface IApprovalRepository {
  findById(id: ApprovalId): Promise<ApprovalRecord | null>;
  findByEstimateId(estimateId: EstimateId): Promise<ApprovalRecord | null>;
  findByCustomerId(customerId: CustomerId): Promise<ApprovalRecord[]>;
  save(record: ApprovalRecord): Promise<void>;
  /**
   * Atomically persists an approval record and the corresponding locked estimate.
   * Ensures that either both succeed or neither succeeds.
   */
  saveAtomicWithEstimate?(record: ApprovalRecord, estimate: Estimate): Promise<void>;
}
