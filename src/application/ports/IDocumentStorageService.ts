export interface IDocumentStorageService {
  generateSignedAccessUrl(storageKey: string, expiresInSeconds: number): Promise<string>;
}
