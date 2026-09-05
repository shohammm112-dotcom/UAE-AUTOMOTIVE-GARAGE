import { IIdempotencyRepository, IdempotencyRecord } from '../../domain/repositories/IIdempotencyRepository.ts';

export class MockIdempotencyRepository implements IIdempotencyRepository {
  private readonly store = new Map<string, IdempotencyRecord>();

  private buildStoreKey(customerId: string, operation: string, key: string): string {
    return `${customerId}:${operation}:${key}`;
  }

  public async findByKey(customerId: string, operation: string, key: string): Promise<IdempotencyRecord | null> {
    const k = this.buildStoreKey(customerId, operation, key);
    return this.store.get(k) || null;
  }

  public async save(record: IdempotencyRecord): Promise<void> {
    const k = this.buildStoreKey(record.customerId, record.operation, record.key);
    this.store.set(k, { ...record });
  }

  public async update(record: IdempotencyRecord): Promise<void> {
    const k = this.buildStoreKey(record.customerId, record.operation, record.key);
    this.store.set(k, { ...record });
  }

  public clear(): void {
    this.store.clear();
  }
}
