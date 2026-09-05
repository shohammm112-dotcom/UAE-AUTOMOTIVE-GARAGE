export interface IdempotencyRecord {
  readonly key: string;
  readonly customerId: string;
  readonly operation: string;
  readonly requestPayloadHash: string;
  readonly status: 'in_progress' | 'completed' | 'failed';
  readonly responseStatusCode: number;
  readonly responseBody: any;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface IIdempotencyRepository {
  findByKey(customerId: string, operation: string, key: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
  update(record: IdempotencyRecord): Promise<void>;
}
