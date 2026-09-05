import { Customer } from '../../../domain/entities/Customer.ts';

export interface CustomerFirestoreDocument {
  id: string;
  authProviderId?: string;
  authProviderType: string;
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  preferredLanguage: 'en' | 'ar';
  createdAt: string;
  updatedAt: string;
}

export class CustomerFirestoreMapper {
  public static toDocument(entity: Customer): CustomerFirestoreDocument {
    return {
      id: entity.id,
      authProviderId: entity.authProviderId,
      authProviderType: entity.authProviderType,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      emirate: entity.emirate,
      preferredLanguage: entity.preferredLanguage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static toDomain(doc: CustomerFirestoreDocument): Customer {
    return new Customer({
      id: doc.id,
      authProviderId: doc.authProviderId,
      authProviderType: doc.authProviderType as 'firebase' | 'supabase' | 'oidc' | 'mock',
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone,
      emirate: doc.emirate,
      preferredLanguage: doc.preferredLanguage,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
