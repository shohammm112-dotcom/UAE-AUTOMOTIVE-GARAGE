import { IEstimateRepository } from '../../../domain/repositories/IEstimateRepository.ts';
import { Estimate } from '../../../domain/entities/Estimate.ts';
import { CustomerId, EstimateId, JobId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { EstimateFirestoreMapper, EstimateFirestoreDocument } from '../mappers/EstimateFirestoreMapper.ts';

export class FirestoreEstimateRepository implements IEstimateRepository {
  private readonly collectionName = 'estimates';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: EstimateId): Promise<Estimate | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return EstimateFirestoreMapper.toDomain(docSnap.data() as EstimateFirestoreDocument);
  }

  public async findByJobId(jobId: JobId): Promise<Estimate[]> {
    const snapshot = await this.collection.where('jobId', '==', jobId).get();
    return snapshot.docs.map((doc) => EstimateFirestoreMapper.toDomain(doc.data() as EstimateFirestoreDocument));
  }

  public async findLatestByJobId(jobId: JobId): Promise<Estimate | null> {
    const estimates = await this.findByJobId(jobId);
    if (estimates.length === 0) return null;
    // Sort by version descending to get latest
    estimates.sort((a, b) => b.version - a.version);
    return estimates[0];
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Estimate[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => EstimateFirestoreMapper.toDomain(doc.data() as EstimateFirestoreDocument));
  }

  public async save(estimate: Estimate): Promise<void> {
    const docData = EstimateFirestoreMapper.toDocument(estimate);
    await this.collection.doc(estimate.id).set(docData);
  }

  public async update(estimate: Estimate): Promise<void> {
    const docData = EstimateFirestoreMapper.toDocument(estimate);
    await this.collection.doc(estimate.id).set(docData, { merge: true });
  }
}
