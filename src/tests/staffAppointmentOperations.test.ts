import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { Appointment } from '../domain/entities/Appointment.ts';
import { AppointmentFirestoreMapper } from '../infrastructure/firebase/mappers/AppointmentFirestoreMapper.ts';
import { AppointmentApplicationService } from '../application/services/AppointmentApplicationService.ts';
import { MockAppointmentRepository } from '../infrastructure/mock/MockAppointmentRepository.ts';
import { AuthenticatedContextFactory } from '../application/security/AuthenticatedContext.ts';
import type { AppointmentStatus } from '../domain/stateMachines/AppointmentStateMachine.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

function appointmentProps(overrides: Partial<ConstructorParameters<typeof Appointment>[0]> = {}) {
  return {
    id: 'apt_staffops_01',
    customerId: 'cust_staffops_01',
    serviceType: 'General Inspection',
    preferredDate: '2099-06-15',
    preferredTimeSlot: 'morning' as const,
    dropoffType: 'customer_dropoff' as const,
    ...overrides,
  };
}

function persistedAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt_persisted_staffops_01',
    customerId: 'cust_staffops_01',
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

const customerContext = (customerId: string) =>
  AuthenticatedContextFactory.forCustomer({ customerId });
const staffContext = (...roles: string[]) => AuthenticatedContextFactory.forStaff({ roles });

let seedCounter = 0;
const seed = async (status: AppointmentStatus = 'requested', customerId = 'cust_staffops_01') => {
  const container = createApplicationContainer();
  seedCounter += 1;
  const appointment = new Appointment(
    appointmentProps({ id: `apt_staffops_${status}_${seedCounter}`, customerId, status })
  );
  await container.repositories.appointmentRepo.save(appointment);
  return { container, appointment };
};

export async function runStaffAppointmentOperationsTests(runner: TestRunner): Promise<void> {
  runner.suite('Staff Appointment Operations (queue, complete, no-show, reschedule)', () => {});

  // --- Staff queue read: intentionally wider than mutation roles ---

  await runner.test('technician CAN read the staff appointment queue', async () => {
    const { container } = await seed();
    const result = await container.services.appointmentService.listAppointmentsForStaff(
      staffContext('technician')
    );
    assert(Array.isArray(result), 'expected an array of appointments');
  });

  await runner.test('mechanic CAN read the staff appointment queue', async () => {
    const { container } = await seed();
    const result = await container.services.appointmentService.listAppointmentsForStaff(
      staffContext('mechanic')
    );
    assert(Array.isArray(result), 'expected an array of appointments');
  });

  await runner.test('a CUSTOMER context cannot read the staff appointment queue', async () => {
    const { container } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.listAppointmentsForStaff(
          customerContext('cust_staffops_01')
        ),
      'Staff authorization is required'
    );
  });

  await runner.test('status filter: a valid status filters correctly', async () => {
    const container = createApplicationContainer();
    const requested = new Appointment(appointmentProps({ id: 'apt_filter_requested' }));
    const confirmed = new Appointment(
      appointmentProps({ id: 'apt_filter_confirmed', status: 'confirmed' })
    );
    await container.repositories.appointmentRepo.save(requested);
    await container.repositories.appointmentRepo.save(confirmed);

    const result = await container.services.appointmentService.listAppointmentsForStaff(
      staffContext('admin'),
      { status: 'confirmed' }
    );

    assert(
      result.every((a) => a.status === 'confirmed'),
      'expected only confirmed appointments in the filtered result'
    );
    assert(
      result.some((a) => a.id === 'apt_filter_confirmed'),
      'expected the seeded confirmed appointment to be present'
    );
    assert(
      !result.some((a) => a.id === 'apt_filter_requested'),
      'expected the seeded requested appointment to be excluded'
    );
  });

  await runner.test('status filter: an unknown status throws ValidationFailedError', async () => {
    const { container } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.listAppointmentsForStaff(staffContext('admin'), {
          status: 'banana',
        }),
      'Unknown appointment status filter'
    );
  });

  // --- complete / no-show: role split matches confirm/cancel exactly ---

  await runner.test('technician CANNOT complete an appointment', async () => {
    const confirmedCase = await seed('confirmed');
    await assertThrows(
      () =>
        confirmedCase.container.services.appointmentService.staffCompleteAppointment(
          staffContext('technician'),
          confirmedCase.appointment.id
        ),
      'Missing required role'
    );
  });

  await runner.test('mechanic CANNOT complete an appointment', async () => {
    const confirmedCase = await seed('confirmed');
    await assertThrows(
      () =>
        confirmedCase.container.services.appointmentService.staffCompleteAppointment(
          staffContext('mechanic'),
          confirmedCase.appointment.id
        ),
      'Missing required role'
    );
  });

  await runner.test('technician CANNOT mark an appointment as no-show', async () => {
    const confirmedCase = await seed('confirmed');
    await assertThrows(
      () =>
        confirmedCase.container.services.appointmentService.staffMarkNoShow(
          staffContext('technician'),
          confirmedCase.appointment.id
        ),
      'Missing required role'
    );
  });

  await runner.test('mechanic CANNOT mark an appointment as no-show', async () => {
    const confirmedCase = await seed('confirmed');
    await assertThrows(
      () =>
        confirmedCase.container.services.appointmentService.staffMarkNoShow(
          staffContext('mechanic'),
          confirmedCase.appointment.id
        ),
      'Missing required role'
    );
  });

  await runner.test('technician CANNOT reschedule an appointment', async () => {
    const { container, appointment } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.staffRescheduleAppointment(
          staffContext('technician'),
          appointment.id,
          { preferredDate: '2099-07-01', preferredTimeSlot: 'afternoon' }
        ),
      'Missing required role'
    );
  });

  await runner.test('mechanic CANNOT reschedule an appointment', async () => {
    const { container, appointment } = await seed();
    await assertThrows(
      () =>
        container.services.appointmentService.staffRescheduleAppointment(
          staffContext('mechanic'),
          appointment.id,
          { preferredDate: '2099-07-01', preferredTimeSlot: 'afternoon' }
        ),
      'Missing required role'
    );
  });

  await runner.test(
    'a CUSTOMER context cannot complete, no-show, or reschedule an appointment',
    async () => {
      const completeCase = await seed('confirmed');
      await assertThrows(() =>
        completeCase.container.services.appointmentService.staffCompleteAppointment(
          customerContext('cust_staffops_01'),
          completeCase.appointment.id
        )
      );

      const noShowCase = await seed('confirmed');
      await assertThrows(() =>
        noShowCase.container.services.appointmentService.staffMarkNoShow(
          customerContext('cust_staffops_01'),
          noShowCase.appointment.id
        )
      );

      const rescheduleCase = await seed();
      await assertThrows(() =>
        rescheduleCase.container.services.appointmentService.staffRescheduleAppointment(
          customerContext('cust_staffops_01'),
          rescheduleCase.appointment.id,
          { preferredDate: '2099-07-01', preferredTimeSlot: 'afternoon' }
        )
      );
    }
  );

  await runner.test('service_advisor CAN complete an appointment', async () => {
    const { container, appointment } = await seed('confirmed');
    const result = await container.services.appointmentService.staffCompleteAppointment(
      staffContext('service_advisor'),
      appointment.id
    );
    assertEquals(result.status, 'completed');
  });

  await runner.test('service_advisor CAN mark an appointment as no-show', async () => {
    const { container, appointment } = await seed('confirmed');
    const result = await container.services.appointmentService.staffMarkNoShow(
      staffContext('service_advisor'),
      appointment.id
    );
    assertEquals(result.status, 'no_show');
  });

  await runner.test('service_advisor CAN reschedule an appointment', async () => {
    const { container, appointment } = await seed('requested');
    const result = await container.services.appointmentService.staffRescheduleAppointment(
      staffContext('service_advisor'),
      appointment.id,
      { preferredDate: '2099-07-02', preferredTimeSlot: 'evening' }
    );
    assertEquals(result.preferredDate, '2099-07-02');
    assertEquals(result.preferredTimeSlot, 'evening');
  });

  // --- all five AppointmentStatus values are now attainable at runtime ---

  await runner.test('all five AppointmentStatus values are now attainable at runtime', async () => {
    const requestedCase = await seed('requested');
    assertEquals(requestedCase.appointment.status, 'requested');

    const confirmCase = await seed('requested');
    const confirmed = await confirmCase.container.services.appointmentService.staffConfirmAppointment(
      staffContext('admin'),
      confirmCase.appointment.id
    );
    assertEquals(confirmed.status, 'confirmed');

    const cancelCase = await seed('requested');
    const cancelled = await cancelCase.container.services.appointmentService.staffCancelAppointment(
      staffContext('admin'),
      cancelCase.appointment.id
    );
    assertEquals(cancelled.status, 'cancelled');

    const completeCase = await seed('confirmed');
    const completed = await completeCase.container.services.appointmentService.staffCompleteAppointment(
      staffContext('admin'),
      completeCase.appointment.id
    );
    assertEquals(completed.status, 'completed');

    const noShowCase = await seed('confirmed');
    const noShow = await noShowCase.container.services.appointmentService.staffMarkNoShow(
      staffContext('admin'),
      noShowCase.appointment.id
    );
    assertEquals(noShow.status, 'no_show');
  });

  // --- illegal lifecycle transitions still rejected ---

  await runner.test('complete() on a requested appointment is rejected', async () => {
    const { container, appointment } = await seed('requested');
    await assertThrows(() =>
      container.services.appointmentService.staffCompleteAppointment(
        staffContext('admin'),
        appointment.id
      )
    );
  });

  await runner.test('markNoShow() on a requested appointment is rejected', async () => {
    const { container, appointment } = await seed('requested');
    await assertThrows(() =>
      container.services.appointmentService.staffMarkNoShow(staffContext('admin'), appointment.id)
    );
  });

  // --- reschedule domain/service edge cases ---

  await runner.test('reschedule on a terminal appointment throws', async () => {
    for (const status of ['cancelled', 'completed', 'no_show'] as const) {
      const { container, appointment } = await seed(status);
      await assertThrows(
        () =>
          container.services.appointmentService.staffRescheduleAppointment(
            staffContext('admin'),
            appointment.id,
            { preferredDate: '2099-08-01', preferredTimeSlot: 'morning' }
          ),
        'terminal status'
      );
    }
  });

  await runner.test('reschedule with a malformed date throws', async () => {
    for (const preferredDate of ['banana', '2026-02-30']) {
      const { container, appointment } = await seed('requested');
      await assertThrows(() =>
        container.services.appointmentService.staffRescheduleAppointment(
          staffContext('admin'),
          appointment.id,
          { preferredDate, preferredTimeSlot: 'morning' }
        )
      );
    }
  });

  await runner.test('reschedule with a past date throws ValidationFailedError', async () => {
    const container = createApplicationContainer();
    const service = new AppointmentApplicationService(
      container.repositories.appointmentRepo,
      container.repositories.vehicleRepo,
      () => new Date('2026-09-07T12:00:00.000Z')
    );
    const appointment = new Appointment(
      appointmentProps({ id: 'apt_reschedule_past', preferredDate: '2099-06-15' })
    );
    await container.repositories.appointmentRepo.save(appointment);

    await assertThrows(
      () =>
        service.staffRescheduleAppointment(staffContext('admin'), appointment.id, {
          preferredDate: '2026-09-06',
          preferredTimeSlot: 'morning',
        }),
      'cannot be in the past'
    );
  });

  await runner.test(
    'reschedule of a confirmed appointment resets its status to requested',
    async () => {
      const { container, appointment } = await seed('confirmed');
      const result = await container.services.appointmentService.staffRescheduleAppointment(
        staffContext('admin'),
        appointment.id,
        { preferredDate: '2099-09-01', preferredTimeSlot: 'afternoon' }
      );
      assertEquals(result.status, 'requested');
    }
  );

  await runner.test(
    'reschedule of a requested appointment stays requested',
    async () => {
      const { container, appointment } = await seed('requested');
      const result = await container.services.appointmentService.staffRescheduleAppointment(
        staffContext('admin'),
        appointment.id,
        { preferredDate: '2099-09-02', preferredTimeSlot: 'evening' }
      );
      assertEquals(result.status, 'requested');
    }
  );

  // --- regression: historical rehydration through the mapper must still work ---

  await runner.test(
    'REGRESSION: a past-dated historical appointment still rehydrates through the mapper',
    () => {
      const appointment = AppointmentFirestoreMapper.toDomain(persistedAppointment());
      assertEquals(appointment.preferredDate, '2020-01-01');
      assertEquals(appointment.status, 'requested');
    }
  );

  // --- SEC: a booker cannot attach a vehicle they do not own ---
  //
  // authMiddleware.ts:47-48 sets customerId and actorType INDEPENDENTLY, so a staff member
  // who is also a registered customer arrives with actorType 'staff' AND a customerId.
  // assertCustomerOwnsEntity early-returns for staff, so using it here let such an account
  // attach ANY customer's vehicle to its own appointment. The check is now a direct
  // comparison against context.customerId.

  await runner.test(
    'SECURITY: a dual staff+customer account cannot attach another customer\'s vehicle',
    async () => {
      const appointmentRepo = new MockAppointmentRepository();
      const vehicleRepo = {
        findById: async (id: string) =>
          id === 'veh_victim' ? ({ id: 'veh_victim', customerId: 'cust_victim' } as never) : null,
      } as never;
      const service = new AppointmentApplicationService(appointmentRepo, vehicleRepo);

      // actorType 'staff' WITH a customerId — exactly what authMiddleware produces.
      const dualAccount = {
        actorType: 'staff',
        customerId: 'cust_staffperson',
        roles: Object.freeze(['technician']),
        staffId: 'stf_1',
        requestId: 'req_dual',
        ipAddress: '127.0.0.1',
      } as never;

      await assertThrows(
        () =>
          service.requestAppointment(dualAccount, {
            serviceType: 'Repair',
            preferredDate: '2099-12-01',
            preferredTimeSlot: 'morning',
            dropoffType: 'customer_dropoff',
            vehicleId: 'veh_victim',
          }),
        'permission'
      );
    }
  );

  await runner.test(
    'a customer CAN still attach a vehicle they do own',
    async () => {
      const appointmentRepo = new MockAppointmentRepository();
      const vehicleRepo = {
        findById: async (id: string) =>
          id === 'veh_mine' ? ({ id: 'veh_mine', customerId: 'cust_owner' } as never) : null,
      } as never;
      const service = new AppointmentApplicationService(appointmentRepo, vehicleRepo);

      const result = await service.requestAppointment(
        AuthenticatedContextFactory.forCustomer({ customerId: 'cust_owner' }),
        {
          serviceType: 'Repair',
          preferredDate: '2099-12-01',
          preferredTimeSlot: 'morning',
          dropoffType: 'customer_dropoff',
          vehicleId: 'veh_mine',
        }
      );
      assertEquals(result.vehicleId, 'veh_mine');
      assertEquals(result.customerId, 'cust_owner');
    }
  );
}
