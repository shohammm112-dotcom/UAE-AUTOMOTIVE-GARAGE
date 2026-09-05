import { AppointmentStateMachine } from '../domain/stateMachines/AppointmentStateMachine.ts';
import { JobStateMachine } from '../domain/stateMachines/JobStateMachine.ts';
import { EstimateStateMachine } from '../domain/stateMachines/EstimateStateMachine.ts';
import { InvoiceStateMachine } from '../domain/stateMachines/InvoiceStateMachine.ts';
import { assert, assertThrows, TestRunner } from './testUtils.ts';

export async function runStateMachineTests(runner: TestRunner): Promise<void> {
  runner.suite('Domain StateMachines: Legal & Illegal Transitions', () => {});

  await runner.test('JobStateMachine: should permit all approved sequential lifecycle stages', () => {
    // 1 -> 2
    assert(JobStateMachine.canTransition('intake_checkin', 'inspection_in_progress'));
    // 2 -> 3
    assert(JobStateMachine.canTransition('inspection_in_progress', 'estimate_pending'));
    // 3 -> 4
    assert(JobStateMachine.canTransition('estimate_pending', 'repair_in_progress'));
    // 4 -> 5
    assert(JobStateMachine.canTransition('repair_in_progress', 'quality_control'));
    // 5 -> 4 (re-work if QC fails)
    assert(JobStateMachine.canTransition('quality_control', 'repair_in_progress'));
    // 5 -> 6
    assert(JobStateMachine.canTransition('quality_control', 'ready_for_delivery'));
    // 6 -> 7
    assert(JobStateMachine.canTransition('ready_for_delivery', 'delivered'));
  });

  await runner.test('JobStateMachine: should reject all illegal stage jumps and backward transitions from delivered', async () => {
    // Jump straight to delivered
    assert(!JobStateMachine.canTransition('intake_checkin', 'delivered'));
    await assertThrows(() => {
      JobStateMachine.assertTransition('intake_checkin', 'delivered');
    }, 'Cannot transition Job');

    // Inspection straight to delivered
    assert(!JobStateMachine.canTransition('inspection_in_progress', 'delivered'));
    await assertThrows(() => {
      JobStateMachine.assertTransition('inspection_in_progress', 'delivered');
    }, 'Cannot transition Job');

    // Estimate straight to delivered
    assert(!JobStateMachine.canTransition('estimate_pending', 'delivered'));
    await assertThrows(() => {
      JobStateMachine.assertTransition('estimate_pending', 'delivered');
    }, 'Cannot transition Job');

    // Backward from delivered (terminal)
    assert(!JobStateMachine.canTransition('delivered', 'repair_in_progress'));
    await assertThrows(() => {
      JobStateMachine.assertTransition('delivered', 'repair_in_progress');
    }, 'Cannot transition Job');
  });

  await runner.test('AppointmentStateMachine: should enforce valid lifecycle paths and reject illegal changes', async () => {
    assert(AppointmentStateMachine.canTransition('requested', 'confirmed'));
    assert(AppointmentStateMachine.canTransition('requested', 'cancelled'));
    assert(AppointmentStateMachine.canTransition('confirmed', 'completed'));
    assert(AppointmentStateMachine.canTransition('confirmed', 'no_show'));

    // Cancelled is terminal
    assert(!AppointmentStateMachine.canTransition('cancelled', 'confirmed'));
    await assertThrows(() => {
      AppointmentStateMachine.assertTransition('cancelled', 'confirmed');
    }, 'Cannot transition Appointment');
  });

  await runner.test('EstimateStateMachine: should enforce locking and immutability', async () => {
    assert(EstimateStateMachine.canTransition('draft', 'pending_customer_decision'));
    assert(EstimateStateMachine.canTransition('pending_customer_decision', 'approved'));
    assert(EstimateStateMachine.canTransition('pending_customer_decision', 'partially_approved'));
    assert(EstimateStateMachine.canTransition('pending_customer_decision', 'rejected'));
    assert(EstimateStateMachine.canTransition('approved', 'locked'));

    // Locked is terminal and immutable
    assert(!EstimateStateMachine.canTransition('locked', 'pending_customer_decision'));
    await assertThrows(() => {
      EstimateStateMachine.assertTransition('locked', 'pending_customer_decision');
    }, 'Cannot transition Estimate');
  });

  await runner.test('InvoiceStateMachine: should enforce legal billing lifecycle', async () => {
    assert(InvoiceStateMachine.canTransition('draft', 'issued'));
    assert(InvoiceStateMachine.canTransition('issued', 'paid'));
    assert(InvoiceStateMachine.canTransition('issued', 'void'));

    // Paid is terminal
    assert(!InvoiceStateMachine.canTransition('paid', 'draft'));
    await assertThrows(() => {
      InvoiceStateMachine.assertTransition('paid', 'draft');
    }, 'Cannot transition Invoice');
  });
}
