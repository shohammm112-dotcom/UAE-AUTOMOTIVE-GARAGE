import { InvalidStateTransitionError } from '../errors/DomainError.ts';

export type JobStage =
  | 'intake_checkin'
  | 'inspection_in_progress'
  | 'estimate_pending'
  | 'repair_in_progress'
  | 'quality_control'
  | 'ready_for_delivery'
  | 'delivered';

export const ORDERED_JOB_STAGES: JobStage[] = [
  'intake_checkin',
  'inspection_in_progress',
  'estimate_pending',
  'repair_in_progress',
  'quality_control',
  'ready_for_delivery',
  'delivered',
];

export class JobStateMachine {
  private static readonly LEGAL_TRANSITIONS: Record<JobStage, JobStage[]> = {
    intake_checkin: ['inspection_in_progress'],
    inspection_in_progress: ['estimate_pending'],
    // From estimate_pending: if approved, repairs start; if vehicle is rejected/cancelled by workshop, it could theoretically go to ready_for_delivery
    estimate_pending: ['repair_in_progress', 'ready_for_delivery'],
    repair_in_progress: ['quality_control'],
    // Quality control can send back to repair_in_progress if QC fails, or advance to ready_for_delivery
    quality_control: ['repair_in_progress', 'ready_for_delivery'],
    ready_for_delivery: ['delivered'],
    delivered: [], // Terminal
  };

  public static canTransition(current: JobStage, target: JobStage): boolean {
    const allowed = this.LEGAL_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Returns the legal next stages from the given stage. Authoritative source
   * for UI action rendering; backend validation via assertTransition remains
   * the actual security/consistency boundary regardless of what this returns.
   */
  public static getLegalNextStages(current: JobStage): JobStage[] {
    return [...(this.LEGAL_TRANSITIONS[current] || [])];
  }

  public static assertTransition(current: JobStage, target: JobStage): void {
    if (!this.canTransition(current, target)) {
      throw new InvalidStateTransitionError('Job', current, target);
    }
  }

  public static getStageIndex(stage: JobStage): number {
    return ORDERED_JOB_STAGES.indexOf(stage);
  }
}
