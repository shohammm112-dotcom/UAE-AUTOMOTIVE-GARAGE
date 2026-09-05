import { InvalidStateTransitionError } from '../errors/DomainError.ts';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export class AppointmentStateMachine {
  private static readonly LEGAL_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    requested: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no_show'],
    cancelled: [],
    completed: [],
    no_show: [],
  };

  public static canTransition(current: AppointmentStatus, target: AppointmentStatus): boolean {
    const allowed = this.LEGAL_TRANSITIONS[current];
    return allowed.includes(target);
  }

  public static assertTransition(current: AppointmentStatus, target: AppointmentStatus): void {
    if (!this.canTransition(current, target)) {
      throw new InvalidStateTransitionError('Appointment', current, target);
    }
  }
}
