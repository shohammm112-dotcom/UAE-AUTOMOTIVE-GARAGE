import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Appointment } from '../domain/entities/Appointment.ts';
import { AppointmentFirestoreMapper } from '../infrastructure/firebase/mappers/AppointmentFirestoreMapper.ts';
import { AppointmentApplicationService, todayInGst } from '../application/services/AppointmentApplicationService.ts';
import { AuthenticatedContextFactory } from '../application/security/AuthenticatedContext.ts';
import type { AppointmentStatus } from '../domain/stateMachines/AppointmentStateMachine.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

const BASE_DATE = '2099-06-15';

function appointmentProps(overrides: Partial<ConstructorParameters<typeof Appointment>[0]> = {}) {
  return {
    id: 'apt_integrity_01',
    customerId: 'cust_integrity_01',
    serviceType: 'General Inspection',
    preferredDate: BASE_DATE,
    preferredTimeSlot: 'morning' as const,
    dropoffType: 'customer_dropoff' as const,
    ...overrides,
  };
}

function persistedAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt_persisted_integrity_01',
    customerId: 'cust_integrity_01',
    serviceType: 'General Inspection',
    preferredDate: '2020-01-01',
    preferredTimeSlot: 'morning',
    dropoffType: 'customer_dropoff',
    customerNotes: '',
    status: 'requested',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export async function runAppointmentDomainIntegrityTests(runner: TestRunner): Promise<void> {
  runner.suite('Appointment Domain Integrity and Authorization', () => {});

  await runner.test('the entity rejects malformed and overflowed calendar dates', async () => {
    for (const preferredDate of ['banana', '2026-13-45', '2026-02-30']) {
      await assertThrows(() =>
        new Appointment(appointmentProps({ preferredDate }))
      );
    }
  });

  await runner.test('a past appointment is rejected by request policy', async () => {
    const container = createApplicationContainer();
    const service = new AppointmentApplicationService(
      container.repositories.appointmentRepo,
      container.repositories.vehicleRepo,
      () => new Date('2026-09-07T12:00:00.000Z')
    );

    await assertThrows(
      () =>
        service.requestAppointment(
          AuthenticatedContextFactory.forCustomer({ customerId: 'cust_integrity_01' }),
          {
            serviceType: 'General Inspection',
            preferredDate: '2026-09-06',
            preferredTimeSlot: 'morning',
            dropoffType: 'customer_dropoff',
          }
        ),
      'cannot be in the past'
    );
  });

  await runner.test('today in GST is accepted by request policy', async () => {
    const injectedNow = new Date('2026-09-07T19:30:00.000Z');
    const today = todayInGst(injectedNow);
    assertEquals(today, '2026-09-07');

    const container = createApplicationContainer();
    const service = new AppointmentApplicationService(
      container.repositories.appointmentRepo,
      container.repositories.vehicleRepo,
      () => injectedNow
    );
    const appointment = await service.requestAppointment(
      AuthenticatedContextFactory.forCustomer({ customerId: 'cust_integrity_01' }),
      {
        serviceType: 'General Inspection',
        preferredDate: today,
        preferredTimeSlot: 'morning',
        dropoffType: 'customer_dropoff',
      }
    );

    assertEquals(appointment.preferredDate, today);
  });

  await runner.test('historical past appointments still rehydrate through the mapper', () => {
    const appointment = AppointmentFirestoreMapper.toDomain(persistedAppointment());
    assertEquals(appointment.preferredDate, '2020-01-01');
    assertEquals(appointment.status, 'requested');
  });

  await runner.test('the entity rejects invalid time slots and dropoff types', async () => {
    await assertThrows(() =>
      new Appointment(appointmentProps({ preferredTimeSlot: 'overnight' as 'morning' }))
    );
    await assertThrows(() =>
      new Appointment(appointmentProps({ dropoffType: 'tow_truck' as 'customer_dropoff' }))
    );
  });

  await runner.test('the mapper rejects a persisted document with a bogus status', async () => {
    await assertThrows(
      () => AppointmentFirestoreMapper.toDomain(persistedAppointment({ status: 'bogus' })),
      'invalid status'
    );
  });

  await runner.test('the mapper rejects bogus persisted time slots and dropoff types', async () => {
    await assertThrows(
      () => AppointmentFirestoreMapper.toDomain(persistedAppointment({ preferredTimeSlot: 'overnight' })),
      'invalid preferred time slot'
    );
    await assertThrows(
      () => AppointmentFirestoreMapper.toDomain(persistedAppointment({ dropoffType: 'tow_truck' })),
      'invalid dropoff type'
    );
  });

  const seed = async (status: AppointmentStatus = 'requested', customerId = 'cust_integrity_01') => {
    const container = createApplicationContainer();
    const appointment = new Appointment(
      appointmentProps({ id: `apt_${status}_${customerId}`, customerId, status })
    );
    await container.repositories.appointmentRepo.save(appointment);
    return { container, appointment };
  };

  const customerContext = (customerId: string) =>
    AuthenticatedContextFactory.forCustomer({ customerId });
  const staffContext = (...roles: string[]) =>
    AuthenticatedContextFactory.forStaff({ roles });

  await runner.test('a customer can cancel their own appointment', async () => {
    const { container, appointment } = await seed();
    const result = await container.services.appointmentService.cancelAppointment(
      customerContext(appointment.customerId),
      appointment.id
    );
    assertEquals(result.status, 'cancelled');
  });

  await runner.test('a customer cannot cancel another customer appointment', async () => {
    const { container, appointment } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.cancelAppointment(
          customerContext('cust_someone_else'),
          appointment.id
        ),
      'do not have permission'
    );
  });

  await runner.test('a technician cannot cancel through the customer route', async () => {
    const { container, appointment } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.cancelAppointment(
          staffContext('technician'),
          appointment.id
        ),
      'Only authenticated customers'
    );
  });

  await runner.test('a mechanic cannot cancel through the customer route', async () => {
    const { container, appointment } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.cancelAppointment(
          staffContext('mechanic'),
          appointment.id
        ),
      'Only authenticated customers'
    );
  });

  await runner.test('technicians and mechanics cannot confirm or staff-cancel appointments', async () => {
    for (const role of ['technician', 'mechanic']) {
      const confirmCase = await seed();
      await assertThrows(
        () =>
          confirmCase.container.services.appointmentService.staffConfirmAppointment(
            staffContext(role),
            confirmCase.appointment.id
          ),
        'Missing required role'
      );

      const cancelCase = await seed();
      await assertThrows(
        () =>
          cancelCase.container.services.appointmentService.staffCancelAppointment(
            staffContext(role),
            cancelCase.appointment.id
          ),
        'Missing required role'
      );
    }
  });

  await runner.test('a service advisor can confirm and staff-cancel an appointment', async () => {
    const { container, appointment } = await seed();
    const context = staffContext('service_advisor');
    const confirmed = await container.services.appointmentService.staffConfirmAppointment(
      context,
      appointment.id
    );
    assertEquals(confirmed.status, 'confirmed');

    const cancelled = await container.services.appointmentService.staffCancelAppointment(
      context,
      appointment.id
    );
    assertEquals(cancelled.status, 'cancelled');
  });

  await runner.test('illegal appointment transitions and terminal states are rejected', async () => {
    const requested = new Appointment(appointmentProps({ id: 'apt_illegal_requested' }));
    requested.confirm();
    await assertThrows(() => requested.confirm());
    requested.complete();
    await assertThrows(() => requested.cancel());

    for (const status of ['cancelled', 'completed', 'no_show'] as const) {
      const terminal = new Appointment(appointmentProps({ id: `apt_terminal_${status}`, status }));
      await assertThrows(() => terminal.confirm());
      await assertThrows(() => terminal.cancel());
      await assertThrows(() => terminal.complete());
      await assertThrows(() => terminal.markNoShow());
    }

    assert(true, 'all illegal transitions were rejected');
  });
}
