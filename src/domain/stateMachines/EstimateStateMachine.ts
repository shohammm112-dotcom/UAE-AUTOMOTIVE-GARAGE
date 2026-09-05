import { InvalidStateTransitionError } from '../errors/DomainError.ts';

export type EstimateStatus =
  | 'draft'
  | 'pending_customer_decision'
  | 'partially_approved'
  | 'approved'
  | 'rejected'
  | 'locked';

export class EstimateStateMachine {
  private static readonly LEGAL_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
    draft: ['pending_customer_decision'],
    pending_customer_decision: ['partially_approved', 'approved', 'rejected'],
    partially_approved: ['locked'],
    approved: ['locked'],
    rejected: ['locked'],
    locked: [], // Terminal: Immutable
  };

  public static canTransition(current: EstimateStatus, target: EstimateStatus): boolean {
    const allowed = this.LEGAL_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  public static assertTransition(current: EstimateStatus, target: EstimateStatus): void {
    if (!this.canTransition(current, target)) {
      throw new InvalidStateTransitionError('Estimate', current, target);
    }
  }

  public static isActionableByCustomer(status: EstimateStatus): boolean {
    return status === 'pending_customer_decision';
  }

  public static isImmutable(status: EstimateStatus): boolean {
    return (
      status === 'locked' ||
      status === 'approved' ||
      status === 'partially_approved' ||
      status === 'rejected'
    );
  }
}
