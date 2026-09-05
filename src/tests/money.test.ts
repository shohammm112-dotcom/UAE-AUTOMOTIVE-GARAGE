import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { InvalidMoneyError } from '../domain/errors/DomainError.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

export async function runMoneyTests(runner: TestRunner): Promise<void> {
  runner.suite('ValueObject: MoneyAed', () => {});

  await runner.test('should construct AED 450.00 as 45000 fils', () => {
    const money = MoneyAed.fromAed(450.0);
    assertEquals(money.amountFils, 45000);
    assertEquals(money.toAed(), 450.0);
    assertEquals(money.toDisplayString(), 'AED 450.00');
  });

  await runner.test('should construct AED 0.01 as exactly 1 fil', () => {
    const money = MoneyAed.fromAed(0.01);
    assertEquals(money.amountFils, 1);
    assertEquals(money.toAed(), 0.01);
    assertEquals(money.toDisplayString(), 'AED 0.01');
  });

  await runner.test('should construct AED 0.00 as 0 fils', () => {
    const money = MoneyAed.fromAed(0.0);
    assertEquals(money.amountFils, 0);
    assertEquals(money.toDisplayString(), 'AED 0.00');
  });

  await runner.test('should handle large amounts deterministically', () => {
    const money = MoneyAed.fromAed(1250000.5);
    assertEquals(money.amountFils, 125000050);
    assertEquals(money.toDisplayString(), 'AED 1,250,000.50');
  });

  await runner.test('should reject non-integer fils', async () => {
    await assertThrows(() => {
      MoneyAed.fromFils(10.5);
    }, 'must be an integer');
  });

  await runner.test('should reject negative amounts', async () => {
    await assertThrows(() => {
      MoneyAed.fromFils(-100);
    }, 'cannot be negative');

    await assertThrows(() => {
      MoneyAed.fromAed(-50);
    }, 'cannot be negative');
  });

  await runner.test('should accurately perform addition without precision loss', () => {
    const m1 = MoneyAed.fromAed(100.15); // 10015 fils
    const m2 = MoneyAed.fromAed(200.25); // 20025 fils
    const sum = m1.add(m2);
    assertEquals(sum.amountFils, 30040);
    assertEquals(sum.toAed(), 300.4);
  });

  await runner.test('should perform subtraction and prevent negative results', async () => {
    const m1 = MoneyAed.fromAed(100.0);
    const m2 = MoneyAed.fromAed(40.0);
    const diff = m1.subtract(m2);
    assertEquals(diff.amountFils, 6000);

    await assertThrows(() => {
      m2.subtract(m1);
    }, 'Subtraction would result in negative money');
  });

  await runner.test('should multiply by integer quantities deterministically', async () => {
    const unitPrice = MoneyAed.fromAed(75.5); // 7550 fils
    const total = unitPrice.multiply(4);
    assertEquals(total.amountFils, 30200);
    assertEquals(total.toAed(), 302.0);

    await assertThrows(() => {
      unitPrice.multiply(2.5);
    }, 'Multiplication quantity must be an integer');
  });

  await runner.test('should perform comparisons correctly', () => {
    const smaller = MoneyAed.fromAed(10.0);
    const larger = MoneyAed.fromAed(20.0);
    const equal = MoneyAed.fromAed(10.0);

    assert(smaller.lessThan(larger));
    assert(larger.greaterThan(smaller));
    assert(smaller.equals(equal));
    assert(smaller.lessThanOrEqual(equal));
    assert(larger.greaterThanOrEqual(smaller));
  });
}
