import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.ts';
import { Customer } from '../../domain/entities/Customer.ts';
import { CustomerId } from '../../domain/types.ts';

export class MockCustomerRepository implements ICustomerRepository {
  private readonly store = new Map<CustomerId, Customer>();

  public async findById(id: CustomerId): Promise<Customer | null> {
    return this.store.get(id) || null;
  }

  public async findByAuthProviderId(authProviderId: string): Promise<Customer | null> {
    for (const c of this.store.values()) {
      if (c.authProviderId === authProviderId) {
        return c;
      }
    }
    return null;
  }

  public async findByEmail(email: string): Promise<Customer | null> {
    const normalized = email.trim().toLowerCase();
    for (const c of this.store.values()) {
      if (c.email === normalized) {
        return c;
      }
    }
    return null;
  }

  public async save(customer: Customer): Promise<void> {
    this.store.set(customer.id, customer);
  }

  public async update(customer: Customer): Promise<void> {
    this.store.set(customer.id, customer);
  }

  public clear(): void {
    this.store.clear();
  }
}
