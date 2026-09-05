import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository.ts';
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository.ts';
import { Appointment } from '../../domain/entities/Appointment.ts';
import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import { AppointmentResponseDto, RequestAppointmentDto } from '../dto/AppDtos.ts';
import { ResourceNotFoundError, ValidationFailedError } from '../errors/ApplicationError.ts';

export class AppointmentApplicationService {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly vehicleRepo: IVehicleRepository
  ) {}

  public async requestAppointment(
    context: AuthenticatedContext,
    dto: RequestAppointmentDto
  ): Promise<AppointmentResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) {
      throw new ValidationFailedError('CustomerId required to request appointment');
    }

    if (dto.vehicleId) {
      const vehicle = await this.vehicleRepo.findById(dto.vehicleId);
      if (!vehicle) {
        throw new ResourceNotFoundError('Vehicle', dto.vehicleId);
      }
      AuthorizationGuard.assertCustomerOwnsEntity(context, vehicle.customerId, 'Vehicle');
    }

    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const appointment = new Appointment({
      id: appointmentId,
      customerId: context.customerId,
      vehicleId: dto.vehicleId,
      serviceType: dto.serviceType,
      preferredDate: dto.preferredDate,
      preferredTimeSlot: dto.preferredTimeSlot,
      dropoffType: dto.dropoffType,
      customerNotes: dto.customerNotes,
    });

    await this.appointmentRepo.save(appointment);
    return this.toDto(appointment);
  }

  public async listAppointmentsForCustomer(
    context: AuthenticatedContext
  ): Promise<AppointmentResponseDto[]> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) return [];

    const appointments = await this.appointmentRepo.findByCustomerId(context.customerId);
    return appointments.map((a) => this.toDto(a));
  }

  public async cancelAppointment(
    context: AuthenticatedContext,
    appointmentId: string
  ): Promise<AppointmentResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new ResourceNotFoundError('Appointment', appointmentId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, appointment.customerId, 'Appointment');
    appointment.cancel();
    await this.appointmentRepo.update(appointment);
    return this.toDto(appointment);
  }

  /**
   * Workshop staff confirms appointment slot.
   */
  public async staffConfirmAppointment(
    context: AuthenticatedContext,
    appointmentId: string
  ): Promise<AppointmentResponseDto> {
    AuthorizationGuard.assertStaffRole(context, ['advisor', 'workshop_manager', 'admin']);

    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new ResourceNotFoundError('Appointment', appointmentId);
    }

    appointment.confirm();
    await this.appointmentRepo.update(appointment);
    return this.toDto(appointment);
  }

  private toDto(a: Appointment): AppointmentResponseDto {
    return {
      id: a.id,
      customerId: a.customerId,
      vehicleId: a.vehicleId,
      serviceType: a.serviceType,
      preferredDate: a.preferredDate,
      preferredTimeSlot: a.preferredTimeSlot,
      dropoffType: a.dropoffType,
      customerNotes: a.customerNotes,
      status: a.status,
      createdAt: a.createdAt,
    };
  }
}
