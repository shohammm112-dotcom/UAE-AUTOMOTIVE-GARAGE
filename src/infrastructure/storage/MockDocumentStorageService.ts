import { IDocumentStorageService } from './IDocumentStorageService.ts';

export class MockDocumentStorageService implements IDocumentStorageService {
  public async generateSignedAccessUrl(storageKey: string, expiresInSeconds: number): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const signature = `sig_${Math.random().toString(36).substring(2, 12)}`;
    // Returns short-lived time-bound URL
    return `https://storage.garage.ae/secure-docs/${encodeURIComponent(storageKey)}?expires=${expiresAt}&signature=${signature}`;
  }
}
