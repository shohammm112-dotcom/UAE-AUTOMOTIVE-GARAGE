import { AppointmentId, CustomerId, VehicleId } from '../types.ts';
import { AppointmentStatus, AppointmentStateMachine } from '../stateMachines/AppointmentStateMachine.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export interface AppointmentProps {
  id: AppointmentId;
  customerId: CustomerId;
  vehicleId?: VehicleId;
  serviceType: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: string; // e.g. "09:00 - 11:00"
  dropoffType: 'customer_dropoff' | 'flatbed_recovery';
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
  readonly preferredTimeSlot: string;
  readonly dropoffType: 'customer_dropoff' | 'flatbed_recovery';
  readonly customerNotes: string;
  private _status: AppointmentStatus;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: AppointmentProps) {
    if (!props.id) throw new InvariantViolationError('AppointmentId cannot be empty');
    if (!props.customerId) throw new InvariantViolationError('Appointment must have a CustomerId');
    if (!props.preferredDate) throw new InvariantViolationError('Preferred date is required');
    if (!props.preferredTimeSlot) throw new InvariantViolationError('Preferred time slot is required');

    this.id = props.id;
    this.customerId = props.customerId;
    this.vehicleId = props.vehicleId;
    this.serviceType = props.serviceType || 'General Inspection';
    this.preferredDate = props.preferredDate;
    this.preferredTimeSlot = props.preferredTimeSlot;
    this.dropoffType = props.dropoffType || 'customer_dropoff';
    this.customerNotes = props.customerNotes ? props.customerNotes.trim() : '';
    this._status = props.status || 'requested';
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
