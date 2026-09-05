import { InvalidPlateError } from '../errors/DomainError.ts';

export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const;

export type UaeEmirate = (typeof UAE_EMIRATES)[number];

export class UaePlate {
  readonly emirate: UaeEmirate;
  readonly code: string;
  readonly number: string;

  private constructor(emirate: UaeEmirate, code: string, number: string) {
    this.emirate = emirate;
    this.code = code;
    this.number = number;
  }

  public static create(emirate: string, code: string, number: string): UaePlate {
    if (!emirate || !code || !number) {
      throw new InvalidPlateError('Emirate, code, and number are required for a UAE plate');
    }

    const normalizedEmirate = UAE_EMIRATES.find(
      (e) => e.toLowerCase() === emirate.trim().toLowerCase()
    );

    if (!normalizedEmirate) {
      throw new InvalidPlateError(
        `Invalid UAE Emirate "${emirate}". Must be one of: ${UAE_EMIRATES.join(', ')}`
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,4}$/.test(normalizedCode)) {
      throw new InvalidPlateError(`Invalid plate code "${code}". Must be 1-4 alphanumeric characters.`);
    }

    const normalizedNumber = number.trim();
    if (!/^[0-9]{1,6}$/.test(normalizedNumber)) {
      throw new InvalidPlateError(`Invalid plate number "${number}". Must be 1-6 digits.`);
    }

    return new UaePlate(normalizedEmirate, normalizedCode, normalizedNumber);
  }

  public toDisplayString(): string {
    return `${this.emirate} - ${this.code} ${this.number}`;
  }

  public equals(other: UaePlate): boolean {
    return (
      this.emirate === other.emirate &&
      this.code === other.code &&
      this.number === other.number
    );
  }
}
