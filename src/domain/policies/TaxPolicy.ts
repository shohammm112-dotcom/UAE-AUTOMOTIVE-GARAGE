import { MoneyAed } from '../valueObjects/MoneyAed.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export interface TaxPolicy {
  readonly jurisdiction: string;
  readonly taxRateBasisPoints: number; // e.g. 500 = 5.00%
  readonly taxRegistrationNumber?: string; // TRN
}

export const UAE_STANDARD_TAX_POLICY: TaxPolicy = {
  jurisdiction: 'UAE',
  taxRateBasisPoints: 500, // 5.00% VAT
  taxRegistrationNumber: 'TRN-100-2026-0001',
};

export interface TaxCalculationResult {
  readonly subtotal: MoneyAed;
  readonly vat: MoneyAed;
  readonly total: MoneyAed;
  readonly policyApplied: TaxPolicy;
}

export class TaxCalculationService {
  public static calculate(subtotal: MoneyAed, policy: TaxPolicy = UAE_STANDARD_TAX_POLICY): TaxCalculationResult {
    if (policy.taxRateBasisPoints < 0) {
      throw new InvariantViolationError('Tax rate basis points cannot be negative');
    }

    const subtotalFils = subtotal.amountFils;
    // Basis points integer math: (subtotalFils * basisPoints) / 10000 with deterministic rounding
    const vatFils = Math.round((subtotalFils * policy.taxRateBasisPoints) / 10000);
    const totalFils = subtotalFils + vatFils;

    return {
      subtotal,
      vat: MoneyAed.fromFils(vatFils),
      total: MoneyAed.fromFils(totalFils),
      policyApplied: policy,
    };
  }
}
