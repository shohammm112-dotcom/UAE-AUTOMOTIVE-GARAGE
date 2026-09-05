import { CustomerId, NotificationId } from '../types.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export type NotificationChannel = 'sms' | 'email' | 'whatsapp' | 'in_app';

export interface NotificationProps {
  id: NotificationId;
  customerId: CustomerId;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  read?: boolean;
  createdAt?: string;
}

export class Notification {
  readonly id: NotificationId;
  readonly customerId: CustomerId;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly body: string;
  readonly metadata?: Record<string, unknown>;
  private _read: boolean;
  readonly createdAt: string;

  constructor(props: NotificationProps) {
    if (!props.id) throw new InvariantViolationError('NotificationId cannot be empty');
    if (!props.customerId) throw new InvariantViolationError('Notification must target a CustomerId');
    if (!props.title) throw new InvariantViolationError('Notification title cannot be empty');

    this.id = props.id;
    this.customerId = props.customerId;
    this.channel = props.channel || 'in_app';
    this.title = props.title.trim();
    this.body = props.body.trim();
    this.metadata = props.metadata;
    this._read = props.read || false;
    this.createdAt = props.createdAt || new Date().toISOString();
  }

  get read(): boolean {
    return this._read;
  }

  public markAsRead(): void {
    this._read = true;
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
