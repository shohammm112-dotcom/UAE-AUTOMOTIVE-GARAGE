import { IAuthTokenVerifier, VerifiedAuthIdentity } from '../../application/security/IAuthTokenVerifier.ts';
import { AuthenticationRequiredError } from '../../application/errors/ApplicationError.ts';

export class MockAuthTokenVerifier implements IAuthTokenVerifier {
  private readonly validTokens = new Map<string, VerifiedAuthIdentity>();

  constructor() {
    // Default seed test tokens for development and unit testing
    this.validTokens.set('test-token-alice', {
      uid: 'firebase_uid_alice',
      email: 'alice@example.ae',
      name: 'Alice Al Mansoori',
      roles: ['customer'],
    });

    this.validTokens.set('test-token-bob', {
      uid: 'firebase_uid_bob',
      email: 'bob@example.ae',
      name: 'Bob Smith',
      roles: ['customer'],
    });

    this.validTokens.set('test-token-staff-advisor', {
      uid: 'firebase_uid_advisor_tariq',
      email: 'tariq@garage.ae',
      name: 'Tariq Service Advisor',
      roles: ['advisor'],
    });

    this.validTokens.set('test-token-staff-manager', {
      uid: 'firebase_uid_manager_khalid',
      email: 'khalid@garage.ae',
      name: 'Khalid Workshop Manager',
      roles: ['workshop_manager', 'admin'],
    });
  }

  public registerToken(token: string, identity: VerifiedAuthIdentity): void {
    this.validTokens.set(token, identity);
  }

  public async verifyToken(token: string): Promise<VerifiedAuthIdentity> {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationRequiredError('Missing or empty authorization token');
    }

    if (token === 'expired-token') {
      throw new AuthenticationRequiredError('Firebase ID token has expired');
    }

    if (token === 'malformed-token' || token.length < 5) {
      throw new AuthenticationRequiredError('Firebase ID token is malformed');
    }

    const identity = this.validTokens.get(token);
    if (!identity) {
      throw new AuthenticationRequiredError('Invalid or untrusted authentication token');
    }

    return identity;
  }
}
