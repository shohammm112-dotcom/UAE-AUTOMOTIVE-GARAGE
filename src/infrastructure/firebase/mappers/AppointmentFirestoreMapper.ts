import { Appointment } from '../../../domain/entities/Appointment.ts';
import {
  isAppointmentStatus,
} from '../../../domain/stateMachines/AppointmentStateMachine.ts';
import {
  isAppointmentDropoffType,
  isAppointmentTimeSlot,
} from '../../../domain/entities/Appointment.ts';
import { InvariantViolationError } from '../../../domain/errors/DomainError.ts';

export interface AppointmentFirestoreDocument {
  id: string;
  customerId: string;
  vehicleId?: string;
  serviceType: string;
  preferredDate: string;
  preferredTimeSlot: string;
  dropoffType: string;
  customerNotes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class AppointmentFirestoreMapper {
  public static toDocument(entity: Appointment): AppointmentFirestoreDocument {
    return {
      id: entity.id,
      customerId: entity.customerId,
      vehicleId: entity.vehicleId,
      serviceType: entity.serviceType,
      preferredDate: entity.preferredDate,
      preferredTimeSlot: entity.preferredTimeSlot,
      dropoffType: entity.dropoffType,
      customerNotes: entity.customerNotes,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static toDomain(doc: AppointmentFirestoreDocument): Appointment {
    if (!isAppointmentStatus(doc.status)) {
      throw new InvariantViolationError(`Persisted appointment has invalid status: ${String(doc.status)}`);
    }
    if (!isAppointmentTimeSlot(doc.preferredTimeSlot)) {
      throw new InvariantViolationError(
        `Persisted appointment has invalid preferred time slot: ${String(doc.preferredTimeSlot)}`
      );
    }
    if (!isAppointmentDropoffType(doc.dropoffType)) {
      throw new InvariantViolationError(
        `Persisted appointment has invalid dropoff type: ${String(doc.dropoffType)}`
      );
    }
    return new Appointment({
      id: doc.id,
      customerId: doc.customerId,
      vehicleId: doc.vehicleId,
      serviceType: doc.serviceType,
      preferredDate: doc.preferredDate,
      preferredTimeSlot: doc.preferredTimeSlot,
      dropoffType: doc.dropoffType,
      customerNotes: doc.customerNotes,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
