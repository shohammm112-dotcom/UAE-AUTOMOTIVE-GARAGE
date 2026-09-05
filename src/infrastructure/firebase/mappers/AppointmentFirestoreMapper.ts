import { Appointment } from '../../../domain/entities/Appointment.ts';
import { AppointmentStatus } from '../../../domain/stateMachines/AppointmentStateMachine.ts';

export interface AppointmentFirestoreDocument {
  id: string;
  customerId: string;
  vehicleId?: string;
  serviceType: string;
  preferredDate: string;
  preferredTimeSlot: string;
  dropoffType: 'customer_dropoff' | 'flatbed_recovery';
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
    return new Appointment({
      id: doc.id,
      customerId: doc.customerId,
      vehicleId: doc.vehicleId,
      serviceType: doc.serviceType,
      preferredDate: doc.preferredDate,
      preferredTimeSlot: doc.preferredTimeSlot,
      dropoffType: doc.dropoffType,
      customerNotes: doc.customerNotes,
      status: doc.status as AppointmentStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
