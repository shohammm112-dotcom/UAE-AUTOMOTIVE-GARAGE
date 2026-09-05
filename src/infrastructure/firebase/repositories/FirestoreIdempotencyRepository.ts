import { IIdempotencyRepository, IdempotencyRecord } from '../../../domain/repositories/IIdempotencyRepository.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';

export class FirestoreIdempotencyRepository implements IIdempotencyRepository {
  private readonly collectionName = 'idempotency_records';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  private buildDocId(customerId: string, operation: string, key: string): string {
    return `${customerId}_${operation}_${key}`;
  }

  public async findByKey(customerId: string, operation: string, key: string): Promise<IdempotencyRecord | null> {
    const docId = this.buildDocId(customerId, operation, key);
    const docSnap = await this.collection.doc(docId).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as IdempotencyRecord;
  }

  public async save(record: IdempotencyRecord): Promise<void> {
    const docId = this.buildDocId(record.customerId, record.operation, record.key);
    await this.collection.doc(docId).set(record);
  }

  public async update(record: IdempotencyRecord): Promise<void> {
    const docId = this.buildDocId(record.customerId, record.operation, record.key);
    await this.collection.doc(docId).set(record, { merge: true });
  }
}
