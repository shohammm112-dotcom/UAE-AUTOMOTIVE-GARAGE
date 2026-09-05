import { IApprovalRepository } from '../../../domain/repositories/IApprovalRepository.ts';
import { ApprovalRecord } from '../../../domain/entities/ApprovalRecord.ts';
import { Estimate } from '../../../domain/entities/Estimate.ts';
import { ApprovalId, CustomerId, EstimateId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { ApprovalFirestoreMapper, ApprovalFirestoreDocument } from '../mappers/ApprovalFirestoreMapper.ts';
import { EstimateFirestoreMapper } from '../mappers/EstimateFirestoreMapper.ts';

export class FirestoreApprovalRepository implements IApprovalRepository {
  private readonly collectionName = 'approvals';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: ApprovalId): Promise<ApprovalRecord | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return ApprovalFirestoreMapper.toDomain(docSnap.data() as ApprovalFirestoreDocument);
  }

  public async findByEstimateId(estimateId: EstimateId): Promise<ApprovalRecord | null> {
    const snapshot = await this.collection.where('estimateId', '==', estimateId).limit(1).get();
    if (snapshot.empty) return null;
    return ApprovalFirestoreMapper.toDomain(snapshot.docs[0].data() as ApprovalFirestoreDocument);
  }

  public async findByCustomerId(customerId: CustomerId): Promise<ApprovalRecord[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => ApprovalFirestoreMapper.toDomain(doc.data() as ApprovalFirestoreDocument));
  }

  public async save(record: ApprovalRecord): Promise<void> {
    const docData = ApprovalFirestoreMapper.toDocument(record);
    await this.collection.doc(record.id).set(docData);
  }

  /**
   * Atomically commits an ApprovalRecord AND locks the corresponding Estimate
   * inside a Firestore read-write transaction (SEC-HIGH-02 remediation).
   * Enforces read-preconditions:
   * 1. Verifies the estimate exists and is in 'pending_customer_decision' status.
   * 2. Verifies that an ApprovalRecord does not already exist for this estimate.
   */
  public async saveAtomicWithEstimate(record: ApprovalRecord, estimate: Estimate): Promise<void> {
    const db = this.client.getDb();
    await db.runTransaction(async (transaction) => {
      const estimateRef = db.collection('estimates').doc(estimate.id);
      const estimateSnap = await transaction.get(estimateRef);
      if (!estimateSnap.exists) {
        throw new Error(`Estimate ${estimate.id} not found during atomic approval transaction`);
      }
      const estimateData = estimateSnap.data() as any;
      if (estimateData.status !== 'pending_customer_decision') {
        throw new Error(
          `CONCURRENCY_CONFLICT: Estimate ${estimate.id} is already in state "${estimateData.status}". Expected "pending_customer_decision".`
        );
      }

      // Check unique approval lock for this estimate
      const approvalLockRef = db.collection('approvals_by_estimate').doc(estimate.id);
      const lockSnap = await transaction.get(approvalLockRef);
      if (lockSnap.exists) {
        throw new Error(
          `CONCURRENCY_CONFLICT: An ApprovalRecord already exists for Estimate ${estimate.id}. Duplicate rejected.`
        );
      }

      const approvalRef = db.collection(this.collectionName).doc(record.id);
      const approvalDoc = ApprovalFirestoreMapper.toDocument(record);
      const estimateDoc = EstimateFirestoreMapper.toDocument(estimate);

      transaction.set(approvalRef, approvalDoc);
      transaction.set(estimateRef, estimateDoc, { merge: true });
      transaction.set(approvalLockRef, {
        approvalId: record.id,
        estimateId: estimate.id,
        createdAt: new Date().toISOString(),
      });
    });
  }
}
