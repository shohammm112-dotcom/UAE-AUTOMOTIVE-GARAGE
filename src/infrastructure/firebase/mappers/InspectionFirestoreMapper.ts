import { InspectionReport, InspectionFinding } from '../../../domain/entities/InspectionReport.ts';

export interface InspectionFirestoreDocument {
  id: string;
  jobId: string;
  inspectorName: string;
  findings: Array<{
    id: string;
    category: string;
    item: string;
    status: string;
    notes: string;
    mediaStorageKeys: string[];
  }>;
  summary: string;
  inspectedAt: string;
}

export class InspectionFirestoreMapper {
  public static toDocument(entity: InspectionReport): InspectionFirestoreDocument {
    return {
      id: entity.id,
      jobId: entity.jobId,
      inspectorName: entity.inspectorName,
      findings: entity.findings.map((f) => ({
        id: f.id,
        category: f.category,
        item: f.item,
        status: f.status,
        notes: f.notes,
        mediaStorageKeys: [...f.mediaStorageKeys],
      })),
      summary: entity.summary,
      inspectedAt: entity.inspectedAt,
    };
  }

  public static toDomain(doc: InspectionFirestoreDocument): InspectionReport {
    return new InspectionReport({
      id: doc.id,
      jobId: doc.jobId,
      inspectorName: doc.inspectorName,
      findings: doc.findings.map((f) => ({
        id: f.id,
        category: f.category as InspectionFinding['category'],
        item: f.item,
        status: f.status as InspectionFinding['status'],
        notes: f.notes,
        mediaStorageKeys: f.mediaStorageKeys,
      })),
      summary: doc.summary,
      inspectedAt: doc.inspectedAt,
    });
  }
}
