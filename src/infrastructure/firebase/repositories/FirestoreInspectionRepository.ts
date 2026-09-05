import { IInspectionRepository } from '../../../domain/repositories/IInspectionRepository.ts';
import { InspectionReport } from '../../../domain/entities/InspectionReport.ts';
import { InspectionReportId, JobId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { InspectionFirestoreMapper, InspectionFirestoreDocument } from '../mappers/InspectionFirestoreMapper.ts';

export class FirestoreInspectionRepository implements IInspectionRepository {
  private readonly collectionName = 'inspection_reports';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: InspectionReportId): Promise<InspectionReport | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return InspectionFirestoreMapper.toDomain(docSnap.data() as InspectionFirestoreDocument);
  }

  public async findByJobId(jobId: JobId): Promise<InspectionReport | null> {
    const snapshot = await this.collection.where('jobId', '==', jobId).limit(1).get();
    if (snapshot.empty) return null;
    return InspectionFirestoreMapper.toDomain(snapshot.docs[0].data() as InspectionFirestoreDocument);
  }

  public async save(report: InspectionReport): Promise<void> {
    const docData = InspectionFirestoreMapper.toDocument(report);
    await this.collection.doc(report.id).set(docData);
  }
}
