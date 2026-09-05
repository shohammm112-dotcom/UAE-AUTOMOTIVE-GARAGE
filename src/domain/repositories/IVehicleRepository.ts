import { Vehicle } from '../entities/Vehicle.ts';
import { CustomerId, VehicleId } from '../types.ts';

export interface IVehicleRepository {
  findById(id: VehicleId): Promise<Vehicle | null>;
  findByCustomerId(customerId: CustomerId): Promise<Vehicle[]>;
  findByVin(vin: string): Promise<Vehicle | null>;
  save(vehicle: Vehicle): Promise<void>;
  update(vehicle: Vehicle): Promise<void>;
  delete(id: VehicleId): Promise<void>;
}
