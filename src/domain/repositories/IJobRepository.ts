import { Job } from '../entities/Job.ts';
import { CustomerId, JobId } from '../types.ts';

export interface IJobRepository {
  findById(id: JobId): Promise<Job | null>;
  findByCustomerId(customerId: CustomerId): Promise<Job[]>;
  findActiveByCustomerId(customerId: CustomerId): Promise<Job[]>;
  listAll(): Promise<Job[]>;
  save(job: Job): Promise<void>;
  update(job: Job): Promise<void>;
}
