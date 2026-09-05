import { CustomerId, VehicleId } from '../types.ts';
import { VinNumber } from '../valueObjects/VinNumber.ts';
import { UaePlate } from '../valueObjects/UaePlate.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export interface VehicleProps {
  id: VehicleId;
  customerId: CustomerId;
  vin: VinNumber;
  plate: UaePlate;
  make: string;
  model: string;
  year: number;
  color: string;
  odometerReadingKm: number;
  createdAt?: string;
  updatedAt?: string;
}

export class Vehicle {
  readonly id: VehicleId;
  private _customerId: CustomerId;
  readonly vin: VinNumber;
  private _plate: UaePlate;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  private _color: string;
  private _odometerReadingKm: number;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: VehicleProps) {
    if (!props.id) throw new InvariantViolationError('VehicleId cannot be empty');
    if (!props.customerId) throw new InvariantViolationError('Vehicle must belong to a CustomerId');
    if (props.year < 1950 || props.year > new Date().getFullYear() + 2) {
      throw new InvariantViolationError(`Invalid vehicle model year: ${props.year}`);
    }
    if (typeof props.odometerReadingKm !== 'number' || isNaN(props.odometerReadingKm) || props.odometerReadingKm < 0 || props.odometerReadingKm > 2000000) {
      throw new InvariantViolationError('Odometer reading must be a valid number between 0 and 2,000,000 km');
    }

    this.id = props.id;
    this._customerId = props.customerId;
    this.vin = props.vin;
    this._plate = props.plate;
    this.make = props.make.trim();
    this.model = props.model.trim();
    this.year = props.year;
    this._color = props.color.trim();
    this._odometerReadingKm = Math.round(props.odometerReadingKm);
    const now = new Date().toISOString();
    this.createdAt = props.createdAt || now;
    this._updatedAt = props.updatedAt || now;
  }

  get customerId(): CustomerId {
    return this._customerId;
  }

  get plate(): UaePlate {
    return this._plate;
  }

  get color(): string {
    return this._color;
  }

  get odometerReadingKm(): number {
    return this._odometerReadingKm;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  public updateMileage(newMileageKm: number): void {
    if (typeof newMileageKm !== 'number' || isNaN(newMileageKm) || newMileageKm < 0 || newMileageKm > 2000000) {
      throw new InvariantViolationError('Odometer reading must be a valid number between 0 and 2,000,000 km');
    }
    if (newMileageKm < this._odometerReadingKm) {
      throw new InvariantViolationError(
        `New odometer reading (${newMileageKm} km) cannot be lower than current reading (${this._odometerReadingKm} km)`
      );
    }
    this._odometerReadingKm = Math.round(newMileageKm);
    this._updatedAt = new Date().toISOString();
  }

  public updatePlate(newPlate: UaePlate): void {
    this._plate = newPlate;
    this._updatedAt = new Date().toISOString();
  }

  public updateColor(newColor: string): void {
    this._color = newColor.trim();
    this._updatedAt = new Date().toISOString();
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this._customerId === customerId;
  }
}
