import { INotificationRepository } from '../../domain/repositories/INotificationRepository.ts';
import { Notification } from '../../domain/entities/Notification.ts';
import { CustomerId, NotificationId } from '../../domain/types.ts';

export class MockNotificationRepository implements INotificationRepository {
  private readonly store = new Map<NotificationId, Notification>();

  public async findById(id: NotificationId): Promise<Notification | null> {
    return this.store.get(id) || null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Notification[]> {
    const results: Notification[] = [];
    for (const n of this.store.values()) {
      if (n.customerId === customerId) {
        results.push(n);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async save(notification: Notification): Promise<void> {
    this.store.set(notification.id, notification);
  }

  public async update(notification: Notification): Promise<void> {
    this.store.set(notification.id, notification);
  }

  public clear(): void {
    this.store.clear();
  }
}
