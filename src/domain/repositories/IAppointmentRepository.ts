import { Appointment } from '../entities/Appointment.ts';
import { AppointmentId, CustomerId } from '../types.ts';

export interface IAppointmentRepository {
  findById(id: AppointmentId): Promise<Appointment | null>;
  findByCustomerId(customerId: CustomerId): Promise<Appointment[]>;
  listAll(): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
}
