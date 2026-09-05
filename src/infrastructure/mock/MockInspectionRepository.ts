import { IInspectionRepository } from '../../domain/repositories/IInspectionRepository.ts';
import { InspectionReport } from '../../domain/entities/InspectionReport.ts';
import { InspectionReportId, JobId } from '../../domain/types.ts';

export class MockInspectionRepository implements IInspectionRepository {
  private readonly store = new Map<InspectionReportId, InspectionReport>();

  public async findById(id: InspectionReportId): Promise<InspectionReport | null> {
    return this.store.get(id) || null;
  }

  public async findByJobId(jobId: JobId): Promise<InspectionReport | null> {
    for (const r of this.store.values()) {
      if (r.jobId === jobId) {
        return r;
      }
    }
    return null;
  }

  public async save(report: InspectionReport): Promise<void> {
    this.store.set(report.id, report);
  }

  public clear(): void {
    this.store.clear();
  }
}
