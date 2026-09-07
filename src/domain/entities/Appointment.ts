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
  readonly preferredDate: string;
  readonly preferredTimeSlot: AppointmentTimeSlot;
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
    this.preferredDate = props.preferredDate;
    this.preferredTimeSlot = props.preferredTimeSlot;
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

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
