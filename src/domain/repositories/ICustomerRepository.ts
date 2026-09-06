import { Customer } from '../entities/Customer.ts';
import { CustomerId } from '../types.ts';

export interface ICustomerRepository {
  findById(id: CustomerId): Promise<Customer | null>;
  findByAuthProviderId(authProviderId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(): Promise<Customer[]>;
  save(customer: Customer): Promise<void>;
  update(customer: Customer): Promise<void>;
}
