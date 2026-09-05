import { Vehicle } from '../../../domain/entities/Vehicle.ts';
import { VinNumber } from '../../../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../../../domain/valueObjects/UaePlate.ts';

export interface VehicleFirestoreDocument {
  id: string;
  customerId: string;
  vin: string;
  plate: {
    emirate: string;
    code: string;
    number: string;
  };
  make: string;
  model: string;
  year: number;
  color: string;
  odometerReadingKm: number;
  createdAt: string;
  updatedAt: string;
}

export class VehicleFirestoreMapper {
  public static toDocument(entity: Vehicle): VehicleFirestoreDocument {
    return {
      id: entity.id,
      customerId: entity.customerId,
      vin: entity.vin.toString(),
      plate: {
        emirate: entity.plate.emirate,
        code: entity.plate.code,
        number: entity.plate.number,
      },
      make: entity.make,
      model: entity.model,
      year: entity.year,
      color: entity.color,
      odometerReadingKm: entity.odometerReadingKm,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static toDomain(doc: VehicleFirestoreDocument): Vehicle {
    return new Vehicle({
      id: doc.id,
      customerId: doc.customerId,
      vin: VinNumber.fromString(doc.vin),
      plate: UaePlate.create(doc.plate.emirate, doc.plate.code, doc.plate.number),
      make: doc.make,
      model: doc.model,
      year: doc.year,
      color: doc.color,
      odometerReadingKm: doc.odometerReadingKm,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
