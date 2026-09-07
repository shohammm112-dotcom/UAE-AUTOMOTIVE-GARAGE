/**
 * Single authority for "is this process running as production?".
 *
 * Two independent signals are consulted, because neither is sufficient alone:
 *
 * 1. PRODUCTION_ARTIFACT - substituted at build time by esbuild (see the
 *    `build` script in package.json). It is baked into `dist/server.cjs`, so a
 *    deployed artifact identifies itself as production even when the operator
 *    sets no environment variables at all. This is the signal that actually
 *    closes the authentication fail-open: nothing in this repository ever sets
 *    NODE_ENV, so a guard keyed only on NODE_ENV would be inert on a real
 *    deployment - exactly the case it exists to prevent.
 *
 * 2. NODE_ENV / APP_ENV - the conventional signal, honoured when present so
 *    that `NODE_ENV=production tsx server.ts` behaves as production too.
 *
 * The dev server (`tsx server.ts`) and the test runner set neither, so both
 * resolve to non-production and mock infrastructure remains available there.
 */
export class RuntimeEnvironment {
  /** True only inside a bundle produced by `npm run build`. */
  public static isProductionArtifact(): boolean {
    return process.env.PRODUCTION_ARTIFACT === 'true';
  }

  public static isProduction(): boolean {
    const declared = (process.env.NODE_ENV || process.env.APP_ENV || '').trim().toLowerCase();
    if (declared === 'production' || declared === 'prod') {
      return true;
    }
    return RuntimeEnvironment.isProductionArtifact();
  }
}
