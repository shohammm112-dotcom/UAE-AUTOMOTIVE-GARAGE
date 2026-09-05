import { CustomerId } from '../types.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export interface CustomerProps {
  id: CustomerId;
  authProviderId?: string;
  authProviderType?: 'firebase' | 'supabase' | 'oidc' | 'mock';
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  preferredLanguage?: 'en' | 'ar';
  createdAt?: string;
  updatedAt?: string;
}

export class Customer {
  readonly id: CustomerId;
  readonly authProviderId?: string;
  readonly authProviderType: 'firebase' | 'supabase' | 'oidc' | 'mock';
  private _fullName: string;
  private _email: string;
  private _phone: string;
  private _emirate: string;
  private _preferredLanguage: 'en' | 'ar';
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: CustomerProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new InvariantViolationError('CustomerId cannot be empty');
    }
    if (!props.fullName || props.fullName.trim().length === 0) {
      throw new InvariantViolationError('Customer full name cannot be empty');
    }
    if (!props.email || !props.email.includes('@')) {
      throw new InvariantViolationError('Valid customer email is required');
    }

    if (props.preferredLanguage && props.preferredLanguage !== 'en' && props.preferredLanguage !== 'ar') {
      throw new InvariantViolationError('Preferred language must be either "en" or "ar"');
    }

    this.id = props.id;
    this.authProviderId = props.authProviderId;
    this.authProviderType = props.authProviderType || 'mock';
    this._fullName = props.fullName.trim();
    this._email = props.email.trim().toLowerCase();
    this._phone = props.phone ? props.phone.trim() : '';
    this._emirate = props.emirate ? props.emirate.trim() : 'Dubai';
    this._preferredLanguage = props.preferredLanguage || 'en';
    const now = new Date().toISOString();
    this.createdAt = props.createdAt || now;
    this._updatedAt = props.updatedAt || now;
  }

  get fullName(): string {
    return this._fullName;
  }

  get email(): string {
    return this._email;
  }

  get phone(): string {
    return this._phone;
  }

  get emirate(): string {
    return this._emirate;
  }

  get preferredLanguage(): 'en' | 'ar' {
    return this._preferredLanguage;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  /**
   * Only permitted profile fields may be updated.
   * Role, CustomerId, and AuthProvider mappings are strictly immutable here.
   */
  public updateProfile(params: {
    fullName?: string;
    phone?: string;
    emirate?: string;
    preferredLanguage?: 'en' | 'ar';
  }): void {
    if (params.fullName !== undefined) {
      if (!params.fullName.trim()) {
        throw new InvariantViolationError('Full name cannot be empty');
      }
      this._fullName = params.fullName.trim();
    }
    if (params.phone !== undefined) {
      this._phone = params.phone.trim();
    }
    if (params.emirate !== undefined) {
      this._emirate = params.emirate.trim();
    }
    if (params.preferredLanguage !== undefined) {
      if (params.preferredLanguage !== 'en' && params.preferredLanguage !== 'ar') {
        throw new InvariantViolationError('Preferred language must be either "en" or "ar"');
      }
      this._preferredLanguage = params.preferredLanguage;
    }
    this._updatedAt = new Date().toISOString();
  }
}
