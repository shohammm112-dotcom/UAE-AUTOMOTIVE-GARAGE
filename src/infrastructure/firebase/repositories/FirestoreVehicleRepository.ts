import { IVehicleRepository } from '../../../domain/repositories/IVehicleRepository.ts';
import { Vehicle } from '../../../domain/entities/Vehicle.ts';
import { CustomerId, VehicleId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { VehicleFirestoreMapper, VehicleFirestoreDocument } from '../mappers/VehicleFirestoreMapper.ts';

export class FirestoreVehicleRepository implements IVehicleRepository {
  private readonly collectionName = 'vehicles';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: VehicleId): Promise<Vehicle | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return VehicleFirestoreMapper.toDomain(docSnap.data() as VehicleFirestoreDocument);
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Vehicle[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => VehicleFirestoreMapper.toDomain(doc.data() as VehicleFirestoreDocument));
  }

  public async findByVin(vin: string): Promise<Vehicle | null> {
    const normalizedVin = vin.trim().toUpperCase();
    const snapshot = await this.collection.where('vin', '==', normalizedVin).limit(1).get();
    if (snapshot.empty) return null;
    return VehicleFirestoreMapper.toDomain(snapshot.docs[0].data() as VehicleFirestoreDocument);
  }

  public async save(vehicle: Vehicle): Promise<void> {
    const docData = VehicleFirestoreMapper.toDocument(vehicle);
    await this.collection.doc(vehicle.id).set(docData);
  }

  public async update(vehicle: Vehicle): Promise<void> {
    const docData = VehicleFirestoreMapper.toDocument(vehicle);
    await this.collection.doc(vehicle.id).set(docData, { merge: true });
  }

  public async delete(id: VehicleId): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
