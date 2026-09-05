import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository.ts';
import { Vehicle } from '../../domain/entities/Vehicle.ts';
import { VinNumber } from '../../domain/valueObjects/VinNumber.ts';
import { UaePlate } from '../../domain/valueObjects/UaePlate.ts';
import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import { RegisterVehicleDto, VehicleResponseDto } from '../dto/AppDtos.ts';
import { ConflictError, ResourceNotFoundError, ValidationFailedError } from '../errors/ApplicationError.ts';

export class VehicleApplicationService {
  constructor(private readonly vehicleRepo: IVehicleRepository) {}

  public async listVehiclesForCustomer(context: AuthenticatedContext): Promise<VehicleResponseDto[]> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) {
      return [];
    }

    const vehicles = await this.vehicleRepo.findByCustomerId(context.customerId);
    return vehicles.map((v) => this.toDto(v));
  }

  public async getVehicleById(context: AuthenticatedContext, vehicleId: string): Promise<VehicleResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new ResourceNotFoundError('Vehicle', vehicleId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, vehicle.customerId, 'Vehicle');
    return this.toDto(vehicle);
  }

  public async registerVehicle(
    context: AuthenticatedContext,
    dto: RegisterVehicleDto
  ): Promise<VehicleResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) {
      throw new ValidationFailedError('CustomerId required to register vehicle');
    }

    // Validate VIN format via value object
    const vinVo = VinNumber.fromString(dto.vin);

    // Check if vehicle with same VIN is already registered
    const existing = await this.vehicleRepo.findByVin(vinVo.toString());
    if (existing) {
      throw new ConflictError(`A vehicle with VIN ${vinVo.toString()} is already registered in the system`);
    }

    // Validate UAE Plate via value object
    const plateVo = UaePlate.create(dto.emirate, dto.plateCode, dto.plateNumber);

    const internalVehicleId = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const vehicle = new Vehicle({
      id: internalVehicleId,
      customerId: context.customerId,
      vin: vinVo,
      plate: plateVo,
      make: dto.make,
      model: dto.model,
      year: dto.year,
      color: dto.color,
      odometerReadingKm: dto.currentMileageKm,
    });

    await this.vehicleRepo.save(vehicle);
    return this.toDto(vehicle);
  }

  public async updateMileage(
    context: AuthenticatedContext,
    vehicleId: string,
    newMileageKm: number
  ): Promise<VehicleResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new ResourceNotFoundError('Vehicle', vehicleId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, vehicle.customerId, 'Vehicle');

    vehicle.updateMileage(newMileageKm);
    await this.vehicleRepo.update(vehicle);
    return this.toDto(vehicle);
  }

  private toDto(v: Vehicle): VehicleResponseDto {
    return {
      id: v.id,
      customerId: v.customerId,
      vin: v.vin.toString(),
      plate: {
        emirate: v.plate.emirate,
        code: v.plate.code,
        number: v.plate.number,
        displayString: v.plate.toDisplayString(),
      },
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      odometerReadingKm: v.odometerReadingKm,
      createdAt: v.createdAt,
    };
  }
}
