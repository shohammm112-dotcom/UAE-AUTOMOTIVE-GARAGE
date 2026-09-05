import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository.ts';
import { Appointment } from '../../domain/entities/Appointment.ts';
import { AppointmentId, CustomerId } from '../../domain/types.ts';

export class MockAppointmentRepository implements IAppointmentRepository {
  private readonly store = new Map<AppointmentId, Appointment>();

  public async findById(id: AppointmentId): Promise<Appointment | null> {
    return this.store.get(id) || null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Appointment[]> {
    const results: Appointment[] = [];
    for (const a of this.store.values()) {
      if (a.customerId === customerId) {
        results.push(a);
      }
    }
    return results;
  }

  public async listAll(): Promise<Appointment[]> {
    return Array.from(this.store.values());
  }

  public async save(appointment: Appointment): Promise<void> {
    this.store.set(appointment.id, appointment);
  }

  public async update(appointment: Appointment): Promise<void> {
    this.store.set(appointment.id, appointment);
  }

  public clear(): void {
    this.store.clear();
  }
}
