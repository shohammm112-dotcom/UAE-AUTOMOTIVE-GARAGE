import { IJobRepository } from '../../../domain/repositories/IJobRepository.ts';
import { Job } from '../../../domain/entities/Job.ts';
import { CustomerId, JobId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { JobFirestoreMapper, JobFirestoreDocument } from '../mappers/JobFirestoreMapper.ts';

export class FirestoreJobRepository implements IJobRepository {
  private readonly collectionName = 'jobs';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: JobId): Promise<Job | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return JobFirestoreMapper.toDomain(docSnap.data() as JobFirestoreDocument);
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Job[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => JobFirestoreMapper.toDomain(doc.data() as JobFirestoreDocument));
  }

  public async findByVehicleId(vehicleId: string): Promise<Job[]> {
    const snapshot = await this.collection.where('vehicleId', '==', vehicleId).get();
    return snapshot.docs.map((doc) => JobFirestoreMapper.toDomain(doc.data() as JobFirestoreDocument));
  }

  public async findActiveByCustomerId(customerId: CustomerId): Promise<Job[]> {
    const all = await this.findByCustomerId(customerId);
    return all.filter((job) => job.stage !== 'delivered');
  }

  public async listAll(): Promise<Job[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => JobFirestoreMapper.toDomain(doc.data() as JobFirestoreDocument));
  }

  public async save(job: Job): Promise<void> {
    const docData = JobFirestoreMapper.toDocument(job);
    await this.collection.doc(job.id).set(docData);
  }

  public async update(job: Job): Promise<void> {
    const docData = JobFirestoreMapper.toDocument(job);
    await this.collection.doc(job.id).set(docData, { merge: true });
  }
}
