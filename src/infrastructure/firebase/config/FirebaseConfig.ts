export type AppEnvironment = 'test' | 'development' | 'production';
export type InfrastructureProvider = 'mock' | 'firebase';

export interface FirebaseServerConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

export class FirebaseConfig {
  public static getEnvironment(): AppEnvironment {
    const env = (process.env.NODE_ENV || process.env.APP_ENV || 'development').toLowerCase();
    if (env === 'production' || env === 'prod') return 'production';
    if (env === 'test') return 'test';
    return 'development';
  }

  public static getProvider(): InfrastructureProvider {
    const provider = (process.env.INFRASTRUCTURE_PROVIDER || '').toLowerCase();
    if (provider === 'firebase') return 'firebase';
    return 'mock';
  }

  /**
   * Loads and validates Firebase Admin credentials.
   * Throws informative, safe errors without leaking secret values into exceptions or logs.
   */
  public static loadConfig(): FirebaseServerConfig {
    const currentEnv = this.getEnvironment();

    // Guardrail: Test mode must NEVER point at production Firebase
    if (currentEnv === 'test') {
      const prodIndicator = process.env.FIREBASE_PROJECT_ID?.toLowerCase() || '';
      if (prodIndicator.includes('prod') || prodIndicator.includes('production')) {
        throw new Error(
          '[SECURITY VIOLATION] Test environment is configured to point at a production Firebase project. Operation halted immediately.'
        );
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

    const missingFields: string[] = [];
    if (!projectId) missingFields.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missingFields.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missingFields.push('FIREBASE_PRIVATE_KEY');

    if (missingFields.length > 0) {
      throw new Error(
        `Firebase initialization failed: Missing required environment variables: ${missingFields.join(', ')}. ` +
        `Ensure these are defined in your secure runtime environment or secrets manager.`
      );
    }

    // Handle escaped newlines in PEM format
    const privateKey = rawPrivateKey!.replace(/\\n/g, '\n');

    return {
      projectId: projectId!,
      clientEmail: clientEmail!,
      privateKey,
    };
  }
}
