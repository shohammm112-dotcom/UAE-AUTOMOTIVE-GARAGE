import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.ts';
import { Customer } from '../../domain/entities/Customer.ts';
import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import { CustomerResponseDto, UpdateCustomerProfileDto } from '../dto/AppDtos.ts';
import { ConflictError, ResourceNotFoundError, ValidationFailedError } from '../errors/ApplicationError.ts';

export class CustomerApplicationService {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  public async getProfile(context: AuthenticatedContext): Promise<CustomerResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) {
      throw new ResourceNotFoundError('Customer profile', 'current_user');
    }

    const customer = await this.customerRepo.findById(context.customerId);
    if (!customer) {
      throw new ResourceNotFoundError('Customer', context.customerId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, customer.id, 'Customer profile');
    return this.toDto(customer);
  }

  public async updateProfile(
    context: AuthenticatedContext,
    dto: UpdateCustomerProfileDto
  ): Promise<CustomerResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) {
      throw new ResourceNotFoundError('Customer profile', 'current_user');
    }

    const customer = await this.customerRepo.findById(context.customerId);
    if (!customer) {
      throw new ResourceNotFoundError('Customer', context.customerId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, customer.id, 'Customer profile');

    customer.updateProfile({
      fullName: dto.fullName,
      phone: dto.phone,
      emirate: dto.emirate,
      preferredLanguage: dto.preferredLanguage,
    });

    await this.customerRepo.update(customer);
    return this.toDto(customer);
  }

  /**
   * Resolves or provisions a domain Customer entity mapped strictly from verified authentication provider credentials.
   * Enforces SEC-CRIT-02:
   * 1. Maps external authProviderId (verified UID) strictly to internal CustomerId.
   * 2. NEVER trusts unverified client-supplied emails to link or adopt existing accounts.
   * 3. Prevents account hijacking and unauthorized identity linking.
   */
  public async syncAuthenticatedCustomer(params: {
    authProviderId: string;
    authProviderType: 'firebase' | 'supabase' | 'oidc' | 'mock';
    verifiedEmail: string;
    fullName?: string;
    phone?: string;
  }): Promise<CustomerResponseDto> {
    if (!params.authProviderId) {
      throw new ValidationFailedError('AuthProviderId is required to resolve customer');
    }
    if (!params.verifiedEmail) {
      throw new ValidationFailedError('Verified email from auth token claims is required');
    }

    // Lookup strictly by authoritative authProviderId
    let customer = await this.customerRepo.findByAuthProviderId(params.authProviderId);

    if (!customer) {
      // Identity Conflict Guard: Ensure another account does not already exist with this verified email under a different provider UID
      const existingByEmail = await this.customerRepo.findByEmail(params.verifiedEmail.trim().toLowerCase());
      if (existingByEmail && existingByEmail.authProviderId !== params.authProviderId) {
        throw new ConflictError(
          `An account is already registered with verified email "${params.verifiedEmail}". Please sign in with the original credential.`
        );
      }

      // Provision a new domain customer with an internal provider-independent ID
      const internalId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      customer = new Customer({
        id: internalId,
        authProviderId: params.authProviderId,
        authProviderType: params.authProviderType,
        fullName: params.fullName ? params.fullName.trim() : 'UAE Motorist',
        email: params.verifiedEmail.trim().toLowerCase(),
        phone: params.phone ? params.phone.trim() : '',
        emirate: 'Dubai',
      });
      await this.customerRepo.save(customer);
    }

    return this.toDto(customer);
  }

  private toDto(c: Customer): CustomerResponseDto {
    return {
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      emirate: c.emirate,
      preferredLanguage: c.preferredLanguage,
      createdAt: c.createdAt,
    };
  }
}
