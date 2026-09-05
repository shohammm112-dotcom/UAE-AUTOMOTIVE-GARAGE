import { Notification } from '../entities/Notification.ts';
import { CustomerId, NotificationId } from '../types.ts';

export interface INotificationRepository {
  findById(id: NotificationId): Promise<Notification | null>;
  findByCustomerId(customerId: CustomerId): Promise<Notification[]>;
  save(notification: Notification): Promise<void>;
  update(notification: Notification): Promise<void>;
}
