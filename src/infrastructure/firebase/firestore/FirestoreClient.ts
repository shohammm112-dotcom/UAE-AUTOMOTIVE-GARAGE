import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { FirebaseConfig, FirebaseServerConfig } from '../config/FirebaseConfig.ts';

export class FirestoreClient {
  private firestoreInstance: Firestore | null = null;

  constructor(
    private readonly explicitInstance?: Firestore,
    private readonly explicitConfig?: FirebaseServerConfig
  ) {
    if (explicitInstance) {
      this.firestoreInstance = explicitInstance;
    }
  }

  public getDb(): Firestore {
    if (this.firestoreInstance) {
      return this.firestoreInstance;
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

    this.firestoreInstance = getFirestore();
    return this.firestoreInstance;
  }
}
