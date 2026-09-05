import { InspectionReportId, JobId } from '../types.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export type InspectionCategory =
  | 'engine_transmission'
  | 'brakes'
  | 'suspension'
  | 'ac_climate'
  | 'battery_electrical'
  | 'tires_wheels'
  | 'body_exterior';

export type InspectionItemStatus =
  | 'pass'
  | 'attention_recommended'
  | 'critical_safety_hazard';

export interface InspectionFinding {
  readonly id: string;
  readonly category: InspectionCategory;
  readonly item: string;
  readonly status: InspectionItemStatus;
  readonly notes: string;
  /** Provider-independent document/storage keys (e.g. "inspections/job_12/front_rotor_wear.jpg") */
  readonly mediaStorageKeys: readonly string[];
}

export interface InspectionReportProps {
  id: InspectionReportId;
  jobId: JobId;
  inspectorName: string;
  findings: InspectionFinding[];
  summary?: string;
  inspectedAt?: string;
}

export class InspectionReport {
  readonly id: InspectionReportId;
  readonly jobId: JobId;
  readonly inspectorName: string;
  readonly findings: readonly InspectionFinding[];
  readonly summary: string;
  readonly inspectedAt: string;

  constructor(props: InspectionReportProps) {
    if (!props.id) throw new InvariantViolationError('InspectionReportId cannot be empty');
    if (!props.jobId) throw new InvariantViolationError('InspectionReport must be linked to a JobId');
    if (!props.findings || props.findings.length === 0) {
      throw new InvariantViolationError('InspectionReport must contain at least one finding');
    }

    this.id = props.id;
    this.jobId = props.jobId;
    this.inspectorName = props.inspectorName || 'Master Diagnostic Technician';
    this.findings = Object.freeze([...props.findings]);
    this.summary = props.summary ? props.summary.trim() : '';
    this.inspectedAt = props.inspectedAt || new Date().toISOString();
  }

  public getCriticalCount(): number {
    return this.findings.filter((f) => f.status === 'critical_safety_hazard').length;
  }

  public getAttentionCount(): number {
    return this.findings.filter((f) => f.status === 'attention_recommended').length;
  }

  public getPassedCount(): number {
    return this.findings.filter((f) => f.status === 'pass').length;
  }
}
