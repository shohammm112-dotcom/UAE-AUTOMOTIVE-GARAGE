import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository.ts';
import { Customer } from '../../../domain/entities/Customer.ts';
import { CustomerId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { CustomerFirestoreMapper, CustomerFirestoreDocument } from '../mappers/CustomerFirestoreMapper.ts';

export class FirestoreCustomerRepository implements ICustomerRepository {
  private readonly collectionName = 'customers';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: CustomerId): Promise<Customer | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return CustomerFirestoreMapper.toDomain(docSnap.data() as CustomerFirestoreDocument);
  }

  public async findByAuthProviderId(authProviderId: string): Promise<Customer | null> {
    const snapshot = await this.collection.where('authProviderId', '==', authProviderId).limit(1).get();
    if (snapshot.empty) return null;
    return CustomerFirestoreMapper.toDomain(snapshot.docs[0].data() as CustomerFirestoreDocument);
  }

  public async findByEmail(email: string): Promise<Customer | null> {
    const normalized = email.trim().toLowerCase();
    const snapshot = await this.collection.where('email', '==', normalized).limit(1).get();
    if (snapshot.empty) return null;
    return CustomerFirestoreMapper.toDomain(snapshot.docs[0].data() as CustomerFirestoreDocument);
  }

  public async findAll(): Promise<Customer[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => CustomerFirestoreMapper.toDomain(doc.data() as CustomerFirestoreDocument));
  }

  public async save(customer: Customer): Promise<void> {
    const docData = CustomerFirestoreMapper.toDocument(customer);
    await this.collection.doc(customer.id).set(docData);
  }

  public async update(customer: Customer): Promise<void> {
    const docData = CustomerFirestoreMapper.toDocument(customer);
    await this.collection.doc(customer.id).set(docData, { merge: true });
  }
}
