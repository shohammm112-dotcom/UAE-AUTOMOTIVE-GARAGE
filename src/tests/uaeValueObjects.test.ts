import { VinNumber } from '../domain/valueObjects/VinNumber.ts';
import { UaePlate, UAE_EMIRATES } from '../domain/valueObjects/UaePlate.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

export async function runUaeValueObjectsTests(runner: TestRunner): Promise<void> {
  runner.suite('ValueObjects: UAE Specifics', () => {});

  await runner.test('VinNumber: should accept valid 17-character VIN and normalize to uppercase', () => {
    const raw = '1hgcr2f83ha123456';
    const vin = VinNumber.fromString(raw);
    assertEquals(vin.value, '1HGCR2F83HA123456');
    assertEquals(vin.toString(), '1HGCR2F83HA123456');
  });

  await runner.test('VinNumber: should reject VIN with invalid length or illegal letters (I, O, Q)', async () => {
    // Too short
    await assertThrows(() => VinNumber.fromString('1HGCR2F83HA123'), 'Invalid VIN');
    // Contains 'I'
    await assertThrows(() => VinNumber.fromString('1HGCR2F83IA123456'), 'Invalid VIN');
    // Contains 'O'
    await assertThrows(() => VinNumber.fromString('1HGCR2F83OA123456'), 'Invalid VIN');
    // Contains 'Q'
    await assertThrows(() => VinNumber.fromString('1HGCR2F83QA123456'), 'Invalid VIN');
    // Empty
    await assertThrows(() => VinNumber.fromString(''), 'cannot be empty');
  });

  await runner.test('UaePlate: should support all 7 UAE Emirates', () => {
    for (const emirate of UAE_EMIRATES) {
      const plate = UaePlate.create(emirate, 'A', '12345');
      assertEquals(plate.emirate, emirate);
      assertEquals(plate.code, 'A');
      assertEquals(plate.number, '12345');
      assert(plate.toDisplayString().includes(emirate));
    }
  });

  await runner.test('UaePlate: should normalize code and reject invalid emirate or format', async () => {
    const plate = UaePlate.create('dubai', 'dxb', '9999');
    assertEquals(plate.emirate, 'Dubai');
    assertEquals(plate.code, 'DXB');
    assertEquals(plate.number, '9999');

    // Invalid emirate
    await assertThrows(() => UaePlate.create('Doha', 'A', '123'), 'Invalid UAE Emirate');
    // Invalid code (non-alphanumeric or too long)
    await assertThrows(() => UaePlate.create('Dubai', 'TOOLONG', '123'), 'Invalid plate code');
    // Invalid number (non-digits)
    await assertThrows(() => UaePlate.create('Dubai', 'A', 'XYZ'), 'Invalid plate number');
  });
}
