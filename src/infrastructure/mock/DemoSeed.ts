import { Customer } from '../../domain/entities/Customer.ts';
import { Vehicle } from '../../domain/entities/Vehicle.ts';
import { Job } from '../../domain/entities/Job.ts';
import { Appointment } from '../../domain/entities/Appointment.ts';
import { Estimate, type EstimateItem, type EstimateItemType } from '../../domain/entities/Estimate.ts';
import { VinNumber } from '../../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../../domain/valueObjects/UaePlate.ts';
import { MoneyAed } from '../../domain/valueObjects/MoneyAed.ts';
import type { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.ts';
import type { IVehicleRepository } from '../../domain/repositories/IVehicleRepository.ts';
import type { IJobRepository } from '../../domain/repositories/IJobRepository.ts';
import type { IEstimateRepository } from '../../domain/repositories/IEstimateRepository.ts';
import type { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository.ts';

/**
 * DEVELOPMENT / DEMO FIXTURE — never loaded in production.
 *
 * Mock repositories start empty and reset on every restart, and the application still has no
 * job-creation path (CLAUDE.md debt #36 — nothing anywhere calls jobRepo.save). Without this
 * fixture a fresh instance has nothing to show: the customer portal, the staff queues and the
 * commercial flow all render empty states.
 *
 * The data below reproduces a REAL client invoice (AutoGuru Auto General Repairing LLC,
 * INV260526412, 26/05/2026) so the demo can be anchored on a document the client recognises.
 * Line items, quantities and unit prices are transcribed verbatim from that invoice.
 *
 * The scenario is deliberately seeded MID-FLOW: the job sits at `estimate_pending` with an
 * estimate awaiting the customer's decision, so the demo performs approval, workshop progression,
 * invoicing and payment live rather than showing an already-finished record.
 */

const CUSTOMER_ID = 'cust_demo_sanjeev';
const VEHICLE_ID = 'veh_demo_patrol';
const JOB_ID = 'job_demo_patrol_001';
const ESTIMATE_ID = 'est_demo_patrol_001';
const APPOINTMENT_ID = 'apt_demo_patrol_001';

/** Matches MockAuthTokenVerifier's `test-token-alice`, so the dev customer login resolves here. */
const DEMO_AUTH_PROVIDER_ID = 'firebase_uid_alice';

/** The ten job descriptions from page 1 of the invoice. */
const JOB_DESCRIPTIONS = [
  'COMPLETE VEHICLE HEALTH CHECK',
  'DIAGNOSE SUSPENSION NOISE & WOBBLE',
  'DIAGNOSE AC COOLING',
  'DIAGNOSE FUEL ECONOMY',
  'REPLACE SPARK PLUGS + IGNITION COIL',
  'REPLACE CATALYTIC CONVERTER',
  'REPLACE SUSPENSION BUSHES',
  'REPLACE BATTERY',
  'CARRY OUT MAJOR SERVICE',
  'CARRY OUT WHEEL ALIGNMENT + BALANCING',
];

/**
 * Invoice line items, in fils (1 AED = 100 fils), transcribed from INV260526412.
 *
 * NOTE ON `type`: the client's invoice has THREE commercial buckets — Spare Parts, Labour
 * Charges, and Sublet Services. Our domain's EstimateItemType is 'part' | 'labor' | 'consumable',
 * which has no 'sublet' member. The two sublet lines are therefore typed 'labor' and marked in
 * their description. Adding a real 'sublet' type is a deliberate commercial-model change and is
 * NOT done here — see the debt note added to CLAUDE.md.
 */
const LINE_ITEMS: ReadonlyArray<{
  id: string;
  type: EstimateItemType;
  description: string;
  quantity: number;
  unitPriceFils: number;
  isMandatory: boolean;
}> = [
  // --- Spare Parts (invoice page 1) ---
  { id: 'itm_spark_plug', type: 'part', description: 'SPARK PLUG', quantity: 6, unitPriceFils: 4860, isMandatory: true },
  { id: 'itm_ignition_coil', type: 'part', description: 'IGNITION COIL', quantity: 1, unitPriceFils: 19627, isMandatory: true },
  { id: 'itm_susp_kit', type: 'part', description: 'FRONT SUSPENSION COMPLETE KIT OEM', quantity: 1, unitPriceFils: 98000, isMandatory: true },
  { id: 'itm_battery', type: 'part', description: 'BATTERY AMARON - 105D26L 80AH', quantity: 1, unitPriceFils: 40524, isMandatory: true },
  { id: 'itm_catalytic', type: 'part', description: 'CATALYTIC CONVERTER - OEM', quantity: 1, unitPriceFils: 55000, isMandatory: false },
  // --- Labour Charges (invoice page 2) ---
  { id: 'itm_labour', type: 'labor', description: 'LABOR CHARGES', quantity: 1, unitPriceFils: 85000, isMandatory: true },
  { id: 'itm_major_service', type: 'labor', description: 'MAJOR SERVICE', quantity: 1, unitPriceFils: 47500, isMandatory: true },
  // --- Sublet Services (invoice page 2) — see NOTE ON `type` above ---
  { id: 'itm_ac_flush', type: 'labor', description: 'AC CONDENSER FLUSH (Sublet Service)', quantity: 1, unitPriceFils: 10000, isMandatory: false },
  { id: 'itm_alignment', type: 'labor', description: 'LASER WHEEL ALIGNMENT + BALANCING - SUV (Sublet Service)', quantity: 1, unitPriceFils: 32000, isMandatory: false },
];

export interface DemoSeedRepositories {
  readonly customerRepo: ICustomerRepository;
  readonly vehicleRepo: IVehicleRepository;
  readonly jobRepo: IJobRepository;
  readonly estimateRepo: IEstimateRepository;
  readonly appointmentRepo: IAppointmentRepository;
}

function buildEstimateItems(): EstimateItem[] {
  return LINE_ITEMS.map((i) => ({
    id: i.id,
    type: i.type,
    description: i.description,
    quantity: i.quantity,
    unitPrice: MoneyAed.fromFils(i.unitPriceFils),
    lineTotal: MoneyAed.fromFils(i.unitPriceFils * i.quantity),
    isMandatory: i.isMandatory,
  }));
}

/**
 * Populates the in-memory repositories with the demo scenario.
 * Idempotent: returns early if the demo customer already exists.
 */
export async function seedDemoData(repositories: DemoSeedRepositories): Promise<void> {
  const existing = await repositories.customerRepo.findById(CUSTOMER_ID);
  if (existing) return;

  const now = new Date().toISOString();

  const customer = new Customer({
    id: CUSTOMER_ID,
    authProviderId: DEMO_AUTH_PROVIDER_ID,
    authProviderType: 'mock',
    fullName: 'Sanjeev Bhatia',
    email: 'alice@example.ae',
    phone: '+971501418442',
    emirate: 'Dubai',
    preferredLanguage: 'en',
  });
  await repositories.customerRepo.save(customer);

  const vehicle = new Vehicle({
    id: VEHICLE_ID,
    customerId: CUSTOMER_ID,
    vin: VinNumber.fromString('JN8FY1NY5NX100590'),
    plate: UaePlate.create('Dubai', 'I', '85504'),
    make: 'Nissan',
    model: 'Patrol Super Safari',
    year: 2022,
    color: 'Black',
    odometerReadingKm: 61323,
  });
  await repositories.vehicleRepo.save(vehicle);

  // Seeded at estimate_pending so the demo can drive approval -> repair -> QC -> delivery live.
  const job = new Job({
    id: JOB_ID,
    customerId: CUSTOMER_ID,
    vehicleId: VEHICLE_ID,
    stage: 'estimate_pending',
    serviceAdvisorName: 'Tariq Service Advisor',
    assignedTechnician: 'Workshop Technician',
    customerConcern: JOB_DESCRIPTIONS.join('; '),
    diagnosticSummary:
      'Health check complete. Suspension noise traced to worn front bushes; misfire on cylinders 3 and 5 ' +
      'from failed spark plugs and one ignition coil; catalytic converter efficiency below threshold; ' +
      'battery failed load test; AC condenser fouled.',
    mileageInKm: 61323,
    createdAt: now,
  });
  await repositories.jobRepo.save(job);

  const estimate = new Estimate({
    id: ESTIMATE_ID,
    jobId: JOB_ID,
    customerId: CUSTOMER_ID,
    status: 'pending_customer_decision',
    items: buildEstimateItems(),
    createdAt: now,
  });
  await repositories.estimateRepo.save(estimate);

  // A pending appointment so the Phase 6.1/6.2 surfaces have something to show.
  const appointment = new Appointment({
    id: APPOINTMENT_ID,
    customerId: CUSTOMER_ID,
    vehicleId: VEHICLE_ID,
    serviceType: 'Major Service',
    preferredDate: nextWeekInGst(),
    preferredTimeSlot: 'morning',
    dropoffType: 'customer_dropoff',
    customerNotes: 'Follow-up after major service. Please check AC cooling again.',
  });
  await repositories.appointmentRepo.save(appointment);
}

/** A near-future date that stays valid regardless of when the demo is run (GST = UTC+4). */
function nextWeekInGst(): string {
  const gst = new Date(Date.now() + 4 * 60 * 60 * 1000 + 7 * 24 * 60 * 60 * 1000);
  return gst.toISOString().slice(0, 10);
}
