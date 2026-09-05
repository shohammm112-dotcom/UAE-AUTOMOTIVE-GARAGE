import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository.ts';
import { Vehicle } from '../../domain/entities/Vehicle.ts';
import { CustomerId, VehicleId } from '../../domain/types.ts';

export class MockVehicleRepository implements IVehicleRepository {
  private readonly store = new Map<VehicleId, Vehicle>();

  public async findById(id: VehicleId): Promise<Vehicle | null> {
    return this.store.get(id) || null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Vehicle[]> {
    const results: Vehicle[] = [];
    for (const v of this.store.values()) {
      if (v.customerId === customerId) {
        results.push(v);
      }
    }
    return results;
  }

  public async findByVin(vin: string): Promise<Vehicle | null> {
    const normalized = vin.trim().toUpperCase();
    for (const v of this.store.values()) {
      if (v.vin.toString() === normalized) {
        return v;
      }
    }
    return null;
  }

  public async save(vehicle: Vehicle): Promise<void> {
    this.store.set(vehicle.id, vehicle);
  }

  public async update(vehicle: Vehicle): Promise<void> {
    this.store.set(vehicle.id, vehicle);
  }

  public async delete(id: VehicleId): Promise<void> {
    this.store.delete(id);
  }

  public clear(): void {
    this.store.clear();
  }
}
