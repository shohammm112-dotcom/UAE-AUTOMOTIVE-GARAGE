import { TestRunner, assertEquals, assert } from './testUtils.ts';
import { CustomerFirestoreMapper } from '../infrastructure/firebase/mappers/CustomerFirestoreMapper.ts';
import { VehicleFirestoreMapper } from '../infrastructure/firebase/mappers/VehicleFirestoreMapper.ts';
import { EstimateFirestoreMapper } from '../infrastructure/firebase/mappers/EstimateFirestoreMapper.ts';
import { ApprovalFirestoreMapper } from '../infrastructure/firebase/mappers/ApprovalFirestoreMapper.ts';
import { InvoiceFirestoreMapper } from '../infrastructure/firebase/mappers/InvoiceFirestoreMapper.ts';
import { Customer } from '../domain/entities/Customer.ts';
import { Vehicle } from '../domain/entities/Vehicle.ts';
import { Estimate } from '../domain/entities/Estimate.ts';
import { ApprovalRecord } from '../domain/entities/ApprovalRecord.ts';
import { Invoice } from '../domain/entities/Invoice.ts';
import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../domain/valueObjects/UaePlate.ts';
import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';

export async function runFirestoreInfrastructureTests(runner: TestRunner): Promise<void> {
  runner.suite('Firestore Infrastructure Mappers & Integrity');

  await runner.test('CustomerFirestoreMapper maps bidirectional without loss', () => {
    const customer = new Customer({
      id: 'cust_fs_1',
      authProviderId: 'firebase_uid_123',
      authProviderType: 'firebase',
      fullName: 'Sultan Al Qasimi',
      email: 'sultan@example.ae',
      phone: '+971501234567',
      emirate: 'Sharjah',
      preferredLanguage: 'ar',
    });

    const docData = CustomerFirestoreMapper.toDocument(customer);
    assertEquals(docData.id, 'cust_fs_1');
    assertEquals(docData.authProviderId, 'firebase_uid_123');
    assertEquals(docData.emirate, 'Sharjah');
    assertEquals(docData.preferredLanguage, 'ar');

    const reconstituted = CustomerFirestoreMapper.toDomain(docData);
    assertEquals(reconstituted.id, customer.id);
    assertEquals(reconstituted.authProviderId, customer.authProviderId);
    assertEquals(reconstituted.fullName, customer.fullName);
    assertEquals(reconstituted.email, customer.email);
    assertEquals(reconstituted.preferredLanguage, 'ar');
  });

  await runner.test('VehicleFirestoreMapper preserves UAE plate and VIN value objects', () => {
    const vehicle = new Vehicle({
      id: 'veh_fs_1',
      customerId: 'cust_fs_1',
      vin: VinNumber.fromString('WAUZZZ4G1FA123456'),
      plate: UaePlate.create('Abu Dhabi', '1', '99999'),
      make: 'Porsche',
      model: 'Taycan Turbo',
      year: 2023,
      color: 'Frozen Blue',
      odometerReadingKm: 18500,
    });

    const docData = VehicleFirestoreMapper.toDocument(vehicle);
    assertEquals(docData.vin, 'WAUZZZ4G1FA123456');
    assertEquals(docData.plate.emirate, 'Abu Dhabi');
    assertEquals(docData.plate.code, '1');
    assertEquals(docData.plate.number, '99999');

    const reconstituted = VehicleFirestoreMapper.toDomain(docData);
    assertEquals(reconstituted.id, vehicle.id);
    assertEquals(reconstituted.vin.toString(), 'WAUZZZ4G1FA123456');
    assertEquals(reconstituted.plate.toDisplayString(), 'Abu Dhabi - 1 99999');
    assertEquals(reconstituted.odometerReadingKm, 18500);
  });

  await runner.test('EstimateFirestoreMapper enforces integer fils without float round-off', () => {
    const estimate = new Estimate({
      id: 'est_fs_1',
      jobId: 'job_fs_1',
      customerId: 'cust_fs_1',
      version: 1,
      status: 'pending_customer_decision',
      items: [
        {
          id: 'item_1',
          type: 'labor',
          description: 'High Voltage Battery Diagnostics',
          quantity: 2,
          unitPrice: MoneyAed.fromFils(45000), // 450.00 AED
          lineTotal: MoneyAed.fromFils(90000), // 900.00 AED
          isMandatory: true,
        },
      ],
    });

    const docData = EstimateFirestoreMapper.toDocument(estimate);
    assertEquals(docData.subtotalFils, 90000);
    assertEquals(docData.vatFils, 4500); // 5% of 900.00 AED = 45.00 AED
    assertEquals(docData.totalFils, 94500); // 945.00 AED
    assertEquals(docData.taxPolicy.taxRateBasisPoints, 500);

    const reconstituted = EstimateFirestoreMapper.toDomain(docData);
    assertEquals(reconstituted.id, 'est_fs_1');
    assertEquals(reconstituted.subtotal.amountFils, 90000);
    assertEquals(reconstituted.vat.amountFils, 4500);
    assertEquals(reconstituted.total.amountFils, 94500);
    assertEquals(reconstituted.items.length, 1);
    assertEquals(reconstituted.items[0].description, 'High Voltage Battery Diagnostics');
  });

  await runner.test('ApprovalFirestoreMapper preserves cryptographic and line-item snapshot integrity', () => {
    const approval = new ApprovalRecord({
      id: 'appr_fs_1',
      estimateId: 'est_fs_1',
      estimateVersion: 1,
      customerId: 'cust_fs_1',
      authenticatedProviderUid: 'firebase_uid_123',
      approvedItemIds: ['item_1'],
      rejectedItemIds: [],
      lineItemsSnapshot: [
        {
          itemId: 'item_1',
          type: 'labor',
          description: 'High Voltage Battery Diagnostics',
          quantity: 2,
          unitPriceFils: 45000,
          lineTotalFils: 90000,
          isMandatory: true,
          approved: true,
        },
      ],
      approvedSubtotalFils: 90000,
      approvedVatFils: 4500,
      approvedTotalFils: 94500,
      serverTimestamp: new Date().toISOString(),
      serverRecordedIp: '194.170.1.1',
      userAgent: 'Mozilla/5.0 UAE-Motorist',
    });

    const docData = ApprovalFirestoreMapper.toDocument(approval);
    assertEquals(docData.approvedTotalFils, 94500);
    assertEquals(docData.serverRecordedIp, '194.170.1.1');
    assert(docData.lineItemsSnapshot.length === 1, 'Expected snapshot array');

    const reconstituted = ApprovalFirestoreMapper.toDomain(docData);
    assertEquals(reconstituted.id, 'appr_fs_1');
    assertEquals(reconstituted.approvedTotalFils, 94500);
    assertEquals(reconstituted.lineItemsSnapshot[0].description, 'High Voltage Battery Diagnostics');
    assertEquals(reconstituted.serverRecordedIp, '194.170.1.1');
  });

  await runner.test('InvoiceFirestoreMapper accurately preserves tax and commercial linkage', () => {
    const invoice = new Invoice({
      id: 'inv_fs_1',
      jobId: 'job_fs_1',
      customerId: 'cust_fs_1',
      estimateId: 'est_fs_1',
      estimateVersion: 1,
      approvalId: 'appr_fs_1',
      status: 'issued',
      subtotal: MoneyAed.fromFils(90000),
      vat: MoneyAed.fromFils(4500),
      total: MoneyAed.fromFils(94500),
      taxRegistrationNumber: '100234567800003',
    });

    const docData = InvoiceFirestoreMapper.toDocument(invoice);
    assertEquals(docData.totalFils, 94500);
    assertEquals(docData.taxRegistrationNumber, '100234567800003');

    const reconstituted = InvoiceFirestoreMapper.toDomain(docData);
    assertEquals(reconstituted.id, 'inv_fs_1');
    assertEquals(reconstituted.total.amountFils, 94500);
    assertEquals(reconstituted.total.toDisplayString(), 'AED 945.00');
    assertEquals(reconstituted.taxRegistrationNumber, '100234567800003');
  });
}
