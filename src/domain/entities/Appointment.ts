import type { AppointmentId, CustomerId, VehicleId } from '../types.ts';
import {
  AppointmentStateMachine,
} from '../stateMachines/AppointmentStateMachine.ts';
import type { AppointmentStatus } from '../stateMachines/AppointmentStateMachine.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export type AppointmentTimeSlot = 'morning' | 'afternoon' | 'evening';
export type AppointmentDropoffType = 'customer_dropoff' | 'flatbed_recovery';

export const APPOINTMENT_TIME_SLOTS: readonly AppointmentTimeSlot[] = [
  'morning',
  'afternoon',
  'evening',
];

export function isAppointmentTimeSlot(v: unknown): v is AppointmentTimeSlot {
  return typeof v === 'string' && APPOINTMENT_TIME_SLOTS.includes(v as AppointmentTimeSlot);
}

export function isAppointmentDropoffType(v: unknown): v is AppointmentDropoffType {
  return v === 'customer_dropoff' || v === 'flatbed_recovery';
}

function isRealCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export interface AppointmentProps {
  id: AppointmentId;
  customerId: CustomerId;
  vehicleId?: VehicleId;
  serviceType: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: AppointmentTimeSlot;
  dropoffType: AppointmentDropoffType;
  customerNotes?: string;
  status?: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export class Appointment {
  readonly id: AppointmentId;
  readonly customerId: CustomerId;
  readonly vehicleId?: VehicleId;
  readonly serviceType: string;
  private _preferredDate: string;
  private _preferredTimeSlot: AppointmentTimeSlot;
  readonly dropoffType: AppointmentDropoffType;
  readonly customerNotes: string;
  private _status: AppointmentStatus;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: AppointmentProps) {
    if (!props.id) throw new InvariantViolationError('AppointmentId cannot be empty');
    if (!props.customerId) throw new InvariantViolationError('Appointment must have a CustomerId');
    if (!isRealCalendarDate(props.preferredDate)) {
      throw new InvariantViolationError('Preferred date must be a real YYYY-MM-DD calendar date');
    }
    if (!isAppointmentTimeSlot(props.preferredTimeSlot)) {
      throw new InvariantViolationError('Preferred time slot must be morning, afternoon, or evening');
    }
    if (!isAppointmentDropoffType(props.dropoffType)) {
      throw new InvariantViolationError(
        'Dropoff type must be customer_dropoff or flatbed_recovery'
      );
    }
    this.id = props.id;
    this.customerId = props.customerId;
    this.vehicleId = props.vehicleId;
    this.serviceType = props.serviceType || 'General Inspection';
    this._preferredDate = props.preferredDate;
    this._preferredTimeSlot = props.preferredTimeSlot;
    this.dropoffType = props.dropoffType;
    this.customerNotes = props.customerNotes ? props.customerNotes.trim() : '';
    this._status = props.status ?? 'requested';
    const now = new Date().toISOString();
    this.createdAt = props.createdAt || now;
    this._updatedAt = props.updatedAt || now;
  }

  get status(): AppointmentStatus {
    return this._status;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  get preferredDate(): string {
    return this._preferredDate;
  }

  get preferredTimeSlot(): AppointmentTimeSlot {
    return this._preferredTimeSlot;
  }

  public confirm(): void {
    AppointmentStateMachine.assertTransition(this._status, 'confirmed');
    this._status = 'confirmed';
    this._updatedAt = new Date().toISOString();
  }

  public cancel(): void {
    AppointmentStateMachine.assertTransition(this._status, 'cancelled');
    this._status = 'cancelled';
    this._updatedAt = new Date().toISOString();
  }

  public complete(): void {
    AppointmentStateMachine.assertTransition(this._status, 'completed');
    this._status = 'completed';
    this._updatedAt = new Date().toISOString();
  }

  public markNoShow(): void {
    AppointmentStateMachine.assertTransition(this._status, 'no_show');
    this._status = 'no_show';
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Moves the appointment to a new preferred date/time slot.
   *
   * Structural validation reuses the exact same helpers the constructor uses
   * (isRealCalendarDate, isAppointmentTimeSlot) so there is only one source of
   * truth for "what is a legal preferred date/time slot" — see the module-level
   * helpers above. There is deliberately NO past-date check here: that policy
   * lives only in the application service (see todayInGst), because this
   * constructor-adjacent path is also exercised when rehydrating historical
   * appointments and must not reject them.
   *
   * Policy: a 'confirmed' appointment resets to 'requested' because the
   * workshop must re-confirm a moved slot. A 'requested' appointment stays
   * 'requested'. Terminal statuses (cancelled, completed, no_show) refuse the
   * operation outright.
   */
  public reschedule(preferredDate: string, preferredTimeSlot: AppointmentTimeSlot): void {
    if (this._status === 'cancelled' || this._status === 'completed' || this._status === 'no_show') {
      throw new InvariantViolationError(
        `Cannot reschedule an appointment in terminal status "${this._status}"`
      );
    }
    if (!isRealCalendarDate(preferredDate)) {
      throw new InvariantViolationError('Preferred date must be a real YYYY-MM-DD calendar date');
    }
    if (!isAppointmentTimeSlot(preferredTimeSlot)) {
      throw new InvariantViolationError('Preferred time slot must be morning, afternoon, or evening');
    }

    this._preferredDate = preferredDate;
    this._preferredTimeSlot = preferredTimeSlot;

    if (this._status === 'confirmed') {
      this._status = 'requested';
    }

    this._updatedAt = new Date().toISOString();
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
