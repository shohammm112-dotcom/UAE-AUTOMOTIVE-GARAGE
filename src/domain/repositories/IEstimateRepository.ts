import { Estimate } from '../entities/Estimate.ts';
import { CustomerId, EstimateId, JobId } from '../types.ts';

export interface IEstimateRepository {
  findById(id: EstimateId): Promise<Estimate | null>;
  findByJobId(jobId: JobId): Promise<Estimate[]>;
  findLatestByJobId(jobId: JobId): Promise<Estimate | null>;
  findByCustomerId(customerId: CustomerId): Promise<Estimate[]>;
  save(estimate: Estimate): Promise<void>;
  update(estimate: Estimate): Promise<void>;
}
