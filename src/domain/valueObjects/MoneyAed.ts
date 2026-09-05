import { InvalidMoneyError } from '../errors/DomainError.ts';

export class MoneyAed {
  readonly amountFils: number;
  readonly currency: 'AED' = 'AED';

  private constructor(amountFils: number) {
    if (!Number.isInteger(amountFils)) {
      throw new InvalidMoneyError(`Amount in fils must be an integer, received: ${amountFils}`);
    }
    if (amountFils < 0) {
      throw new InvalidMoneyError(`Amount in fils cannot be negative, received: ${amountFils}`);
    }
    this.amountFils = amountFils;
  }

  public static fromFils(amountFils: number): MoneyAed {
    return new MoneyAed(amountFils);
  }

  public static fromAed(amountAed: number): MoneyAed {
    if (typeof amountAed !== 'number' || isNaN(amountAed) || !isFinite(amountAed)) {
      throw new InvalidMoneyError(`Invalid AED amount: ${amountAed}`);
    }
    if (amountAed < 0) {
      throw new InvalidMoneyError(`AED amount cannot be negative: ${amountAed}`);
    }
    // Strict conversion: round to nearest fil to prevent IEEE 754 precision leakage
    const fils = Math.round(amountAed * 100);
    return new MoneyAed(fils);
  }

  public static zero(): MoneyAed {
    return new MoneyAed(0);
  }

  public add(other: MoneyAed): MoneyAed {
    return new MoneyAed(this.amountFils + other.amountFils);
  }

  public subtract(other: MoneyAed): MoneyAed {
    const diff = this.amountFils - other.amountFils;
    if (diff < 0) {
      throw new InvalidMoneyError(`Subtraction would result in negative money: ${this.amountFils} - ${other.amountFils}`);
    }
    return new MoneyAed(diff);
  }

  public multiply(quantity: number): MoneyAed {
    if (!Number.isInteger(quantity)) {
      throw new InvalidMoneyError(`Multiplication quantity must be an integer, received: ${quantity}`);
    }
    if (quantity < 0) {
      throw new InvalidMoneyError(`Multiplication quantity cannot be negative, received: ${quantity}`);
    }
    return new MoneyAed(this.amountFils * quantity);
  }

  public equals(other: MoneyAed): boolean {
    return this.amountFils === other.amountFils;
  }

  public greaterThan(other: MoneyAed): boolean {
    return this.amountFils > other.amountFils;
  }

  public greaterThanOrEqual(other: MoneyAed): boolean {
    return this.amountFils >= other.amountFils;
  }

  public lessThan(other: MoneyAed): boolean {
    return this.amountFils < other.amountFils;
  }

  public lessThanOrEqual(other: MoneyAed): boolean {
    return this.amountFils <= other.amountFils;
  }

  public toAed(): number {
    return this.amountFils / 100;
  }

  public toDisplayString(): string {
    const formatted = (this.amountFils / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `AED ${formatted}`;
  }
}
