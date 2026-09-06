import { IJobRepository } from '../../domain/repositories/IJobRepository.ts';
import { Job } from '../../domain/entities/Job.ts';
import { CustomerId, JobId } from '../../domain/types.ts';

export class MockJobRepository implements IJobRepository {
  private readonly store = new Map<JobId, Job>();

  public async findById(id: JobId): Promise<Job | null> {
    return this.store.get(id) || null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Job[]> {
    const results: Job[] = [];
    for (const j of this.store.values()) {
      if (j.customerId === customerId) {
        results.push(j);
      }
    }
    return results;
  }

  public async findByVehicleId(vehicleId: string): Promise<Job[]> {
    const results: Job[] = [];
    for (const j of this.store.values()) {
      if (j.vehicleId === vehicleId) {
        results.push(j);
      }
    }
    return results;
  }

  public async findActiveByCustomerId(customerId: CustomerId): Promise<Job[]> {
    const results: Job[] = [];
    for (const j of this.store.values()) {
      if (j.customerId === customerId && j.stage !== 'delivered') {
        results.push(j);
      }
    }
    return results;
  }

  public async listAll(): Promise<Job[]> {
    return Array.from(this.store.values());
  }

  public async save(job: Job): Promise<void> {
    this.store.set(job.id, job);
  }

  public async update(job: Job): Promise<void> {
    this.store.set(job.id, job);
  }

  public clear(): void {
    this.store.clear();
  }
}
