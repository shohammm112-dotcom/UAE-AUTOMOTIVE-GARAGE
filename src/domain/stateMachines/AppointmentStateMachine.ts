import { InvalidStateTransitionError } from '../errors/DomainError.ts';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

const LEGAL_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  cancelled: [],
  completed: [],
  no_show: [],
};

/** Runtime status validation is derived from the authoritative transition map. */
export function isAppointmentStatus(v: unknown): v is AppointmentStatus {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(LEGAL_TRANSITIONS, v);
}

export class AppointmentStateMachine {
  private static readonly LEGAL_TRANSITIONS = LEGAL_TRANSITIONS;

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
