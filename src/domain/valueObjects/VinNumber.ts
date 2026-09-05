import { InvalidVinError } from '../errors/DomainError.ts';

export class VinNumber {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static fromString(rawVin: string): VinNumber {
    if (!rawVin || typeof rawVin !== 'string') {
      throw new InvalidVinError('VIN cannot be empty');
    }

    const normalized = rawVin.trim().toUpperCase();

    // Standard ISO 3779: 17 alphanumeric characters, excluding I, O, Q
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(normalized)) {
      throw new InvalidVinError(
        `Invalid VIN "${normalized}". A VIN must be exactly 17 characters long and exclude I, O, and Q.`
      );
    }

    return new VinNumber(normalized);
  }

  public equals(other: VinNumber): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
