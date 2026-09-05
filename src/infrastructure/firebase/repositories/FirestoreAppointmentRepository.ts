import { IAppointmentRepository } from '../../../domain/repositories/IAppointmentRepository.ts';
import { Appointment } from '../../../domain/entities/Appointment.ts';
import { AppointmentId, CustomerId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { AppointmentFirestoreMapper, AppointmentFirestoreDocument } from '../mappers/AppointmentFirestoreMapper.ts';

export class FirestoreAppointmentRepository implements IAppointmentRepository {
  private readonly collectionName = 'appointments';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: AppointmentId): Promise<Appointment | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return AppointmentFirestoreMapper.toDomain(docSnap.data() as AppointmentFirestoreDocument);
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Appointment[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => AppointmentFirestoreMapper.toDomain(doc.data() as AppointmentFirestoreDocument));
  }

  public async listAll(): Promise<Appointment[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => AppointmentFirestoreMapper.toDomain(doc.data() as AppointmentFirestoreDocument));
  }

  public async save(appointment: Appointment): Promise<void> {
    const docData = AppointmentFirestoreMapper.toDocument(appointment);
    await this.collection.doc(appointment.id).set(docData);
  }

  public async update(appointment: Appointment): Promise<void> {
    const docData = AppointmentFirestoreMapper.toDocument(appointment);
    await this.collection.doc(appointment.id).set(docData, { merge: true });
  }
}
