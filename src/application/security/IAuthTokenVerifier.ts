export interface VerifiedAuthIdentity {
  readonly uid: string;
  readonly email?: string;
  readonly name?: string;
  readonly roles?: readonly string[];
}

export interface IAuthTokenVerifier {
  verifyToken(token: string): Promise<VerifiedAuthIdentity>;
}
