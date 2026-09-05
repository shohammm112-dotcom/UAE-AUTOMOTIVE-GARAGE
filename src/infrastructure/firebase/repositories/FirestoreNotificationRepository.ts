import { INotificationRepository } from '../../../domain/repositories/INotificationRepository.ts';
import { Notification } from '../../../domain/entities/Notification.ts';
import { CustomerId, NotificationId } from '../../../domain/types.ts';
import { FirestoreClient } from '../firestore/FirestoreClient.ts';
import { NotificationFirestoreMapper, NotificationFirestoreDocument } from '../mappers/NotificationFirestoreMapper.ts';

export class FirestoreNotificationRepository implements INotificationRepository {
  private readonly collectionName = 'notifications';

  constructor(private readonly client: FirestoreClient) {}

  private get collection() {
    return this.client.getDb().collection(this.collectionName);
  }

  public async findById(id: NotificationId): Promise<Notification | null> {
    const docSnap = await this.collection.doc(id).get();
    if (!docSnap.exists) return null;
    return NotificationFirestoreMapper.toDomain(docSnap.data() as NotificationFirestoreDocument);
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Notification[]> {
    const snapshot = await this.collection.where('customerId', '==', customerId).get();
    return snapshot.docs.map((doc) => NotificationFirestoreMapper.toDomain(doc.data() as NotificationFirestoreDocument));
  }

  public async save(notification: Notification): Promise<void> {
    const docData = NotificationFirestoreMapper.toDocument(notification);
    await this.collection.doc(notification.id).set(docData);
  }

  public async update(notification: Notification): Promise<void> {
    const docData = NotificationFirestoreMapper.toDocument(notification);
    await this.collection.doc(notification.id).set(docData, { merge: true });
  }
}
