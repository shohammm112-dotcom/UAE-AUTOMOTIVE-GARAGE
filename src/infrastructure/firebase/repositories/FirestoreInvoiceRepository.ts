import { IInvoiceRepository } from '../../../domain/repositories/IInvoiceRepository.ts';
import { Invoice } from '../../../domain/entities/Invoice.ts';
import { ApprovalId, CustomerId, InvoiceId, JobId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { InvoiceFirestoreMapper, InvoiceFirestoreDocument } from '../mappers/InvoiceFirestoreMapper.ts';

export class FirestoreInvoiceRepository implements IInvoiceRepository {
  private readonly collectionName = 'invoices';
  private readonly approvalIndexCollection = 'invoices_by_approval';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: InvoiceId): Promise<Invoice | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return InvoiceFirestoreMapper.toDomain(docSnap.data() as InvoiceFirestoreDocument);
  }

  public async findByJobId(jobId: JobId): Promise<Invoice | null> {
    const snapshot = await this.collection.where('jobId', '==', jobId).limit(1).get();
    if (snapshot.empty) return null;
    return InvoiceFirestoreMapper.toDomain(snapshot.docs[0].data() as InvoiceFirestoreDocument);
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Invoice[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => InvoiceFirestoreMapper.toDomain(doc.data() as InvoiceFirestoreDocument));
  }

  public async findByApprovalId(approvalId: ApprovalId): Promise<Invoice | null> {
    const snapshot = await this.collection.where('approvalId', '==', approvalId).limit(1).get();
    if (snapshot.empty) return null;
    return InvoiceFirestoreMapper.toDomain(snapshot.docs[0].data() as InvoiceFirestoreDocument);
  }

  public async listAll(): Promise<Invoice[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => InvoiceFirestoreMapper.toDomain(doc.data() as InvoiceFirestoreDocument));
  }

  public async save(invoice: Invoice): Promise<void> {
    const db = this.client.getDb();
    await db.runTransaction(async (transaction) => {
      // Concurrency guard: check if unique approval index doc exists
      const approvalLockRef = db.collection(this.approvalIndexCollection).doc(invoice.approvalId);
      const lockSnap = await transaction.get(approvalLockRef);
      if (lockSnap.exists) {
        throw new Error(
          `CONCURRENCY_CONFLICT: An invoice has already been generated for approval ${invoice.approvalId}`
        );
      }

      const docData = InvoiceFirestoreMapper.toDocument(invoice);
      const invoiceRef = this.collection.doc(invoice.id);
      transaction.set(invoiceRef, docData);
      transaction.set(approvalLockRef, {
        invoiceId: invoice.id,
        approvalId: invoice.approvalId,
        createdAt: new Date().toISOString(),
      });
    });
  }

  public async update(invoice: Invoice): Promise<void> {
    const docData = InvoiceFirestoreMapper.toDocument(invoice);
    await this.collection.doc(invoice.id).set(docData, { merge: true });
  }
}
