import { InspectionReport } from '../entities/InspectionReport.ts';
import { InspectionReportId, JobId } from '../types.ts';

export interface IInspectionRepository {
  findById(id: InspectionReportId): Promise<InspectionReport | null>;
  findByJobId(jobId: JobId): Promise<InspectionReport | null>;
  save(report: InspectionReport): Promise<void>;
}
