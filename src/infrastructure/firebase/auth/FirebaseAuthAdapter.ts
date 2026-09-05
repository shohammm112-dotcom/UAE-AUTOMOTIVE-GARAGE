import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { IAuthTokenVerifier, VerifiedAuthIdentity } from '../../../application/security/IAuthTokenVerifier.ts';
import { AuthenticationRequiredError } from '../../../application/errors/ApplicationError.ts';
import { FirebaseConfig, FirebaseServerConfig } from '../config/FirebaseConfig.ts';

export class FirebaseAuthAdapter implements IAuthTokenVerifier {
  private authInstance: Auth | null = null;

  constructor(private readonly explicitConfig?: FirebaseServerConfig) {}

  private getAuthInstance(): Auth {
    if (this.authInstance) {
      return this.authInstance;
    }

    if (getApps().length === 0) {
      const config = this.explicitConfig || FirebaseConfig.loadConfig();
      initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
    }

    this.authInstance = getAuth();
    return this.authInstance;
  }

  public async verifyToken(token: string): Promise<VerifiedAuthIdentity> {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationRequiredError('Missing or empty authorization token');
    }

    try {
      const auth = this.getAuthInstance();
      const decodedToken = await auth.verifyIdToken(token, true);

      // Extract custom claims if present
      const roles: string[] = [];
      if (Array.isArray(decodedToken.roles)) {
        roles.push(...decodedToken.roles);
      } else if (typeof decodedToken.role === 'string') {
        roles.push(decodedToken.role);
      } else {
        roles.push('customer');
      }

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        roles,
      };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'auth/id-token-expired') {
        throw new AuthenticationRequiredError('Firebase authentication token has expired');
      }
      if (error?.code === 'auth/id-token-revoked') {
        throw new AuthenticationRequiredError('Firebase authentication token has been revoked');
      }
      if (error?.code === 'auth/argument-error' || error?.code === 'auth/invalid-id-token') {
        throw new AuthenticationRequiredError('Firebase authentication token is invalid or malformed');
      }
      throw new AuthenticationRequiredError('Failed to verify authentication credentials');
    }
  }
}
