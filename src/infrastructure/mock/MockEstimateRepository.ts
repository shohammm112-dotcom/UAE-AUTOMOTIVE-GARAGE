import { IEstimateRepository } from '../../domain/repositories/IEstimateRepository.ts';
import { Estimate } from '../../domain/entities/Estimate.ts';
import { CustomerId, EstimateId, JobId } from '../../domain/types.ts';

export class MockEstimateRepository implements IEstimateRepository {
  private readonly store = new Map<EstimateId, Estimate>();

  public async findById(id: EstimateId): Promise<Estimate | null> {
    return this.store.get(id) || null;
  }

  public async findByJobId(jobId: JobId): Promise<Estimate[]> {
    const results: Estimate[] = [];
    for (const e of this.store.values()) {
      if (e.jobId === jobId) {
        results.push(e);
      }
    }
    return results.sort((a, b) => b.version - a.version);
  }

  public async findLatestByJobId(jobId: JobId): Promise<Estimate | null> {
    const estimates = await this.findByJobId(jobId);
    return estimates.length > 0 ? estimates[0] : null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Estimate[]> {
    const results: Estimate[] = [];
    for (const e of this.store.values()) {
      if (e.customerId === customerId) {
        results.push(e);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async save(estimate: Estimate): Promise<void> {
    this.store.set(estimate.id, estimate);
  }

  public async update(estimate: Estimate): Promise<void> {
    this.store.set(estimate.id, estimate);
  }

  public clear(): void {
    this.store.clear();
  }
}
