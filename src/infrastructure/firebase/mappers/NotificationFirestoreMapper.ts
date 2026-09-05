import { Notification, NotificationChannel } from '../../../domain/entities/Notification.ts';

export interface NotificationFirestoreDocument {
  id: string;
  customerId: string;
  channel: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export class NotificationFirestoreMapper {
  public static toDocument(entity: Notification): NotificationFirestoreDocument {
    return {
      id: entity.id,
      customerId: entity.customerId,
      channel: entity.channel,
      title: entity.title,
      body: entity.body,
      metadata: entity.metadata,
      read: entity.read,
      createdAt: entity.createdAt,
    };
  }

  public static toDomain(doc: NotificationFirestoreDocument): Notification {
    return new Notification({
      id: doc.id,
      customerId: doc.customerId,
      channel: doc.channel as NotificationChannel,
      title: doc.title,
      body: doc.body,
      metadata: doc.metadata,
      read: doc.read,
      createdAt: doc.createdAt,
    });
  }
}
