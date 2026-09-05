import { MoneyAed } from '../domain/valueObjects/MoneyAed.ts';
import { TaxCalculationService, TaxPolicy, UAE_STANDARD_TAX_POLICY } from '../domain/policies/TaxPolicy.ts';
import { assertEquals, TestRunner } from './testUtils.ts';

export async function runTaxPolicyTests(runner: TestRunner): Promise<void> {
  runner.suite('Domain Policy: TaxPolicy & VAT Calculation', () => {});

  await runner.test('should calculate 5% VAT on 1,000 AED subtotal deterministically', () => {
    const subtotal = MoneyAed.fromAed(1000.0); // 100,000 fils
    const result = TaxCalculationService.calculate(subtotal, UAE_STANDARD_TAX_POLICY);

    // 100,000 * 500 / 10000 = 5,000 fils (50 AED)
    assertEquals(result.vat.amountFils, 5000);
    assertEquals(result.vat.toAed(), 50.0);
    assertEquals(result.total.amountFils, 105000);
    assertEquals(result.total.toAed(), 1050.0);
  });

  await runner.test('should accurately perform half-up rounding in integer fils on fractional tax', () => {
    // Subtotal: 10.15 AED = 1015 fils
    // VAT: 1015 * 500 / 10000 = 50.75 fils -> rounded to 51 fils (0.51 AED)
    const subtotal = MoneyAed.fromAed(10.15);
    const result = TaxCalculationService.calculate(subtotal, UAE_STANDARD_TAX_POLICY);

    assertEquals(result.vat.amountFils, 51);
    assertEquals(result.vat.toAed(), 0.51);
    assertEquals(result.total.amountFils, 1066);
    assertEquals(result.total.toAed(), 10.66);
  });

  await runner.test('should support future tax policy updates without rewriting entities', () => {
    const customPolicy: TaxPolicy = {
      jurisdiction: 'UAE',
      taxRateBasisPoints: 1000, // 10.00% VAT
    };

    const subtotal = MoneyAed.fromAed(500.0); // 50,000 fils
    const result = TaxCalculationService.calculate(subtotal, customPolicy);

    // 50,000 * 1000 / 10000 = 5,000 fils (50 AED)
    assertEquals(result.vat.amountFils, 5000);
    assertEquals(result.total.amountFils, 55000);
  });
}
