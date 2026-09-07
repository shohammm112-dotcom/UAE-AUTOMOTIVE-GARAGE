import http from 'node:http';
import { createApplicationContainer } from '../infrastructure/di/container.ts';
import { createExpressApp } from '../server/app.ts';
import { MockAuthTokenVerifier } from '../infrastructure/mock/MockAuthTokenVerifier.ts';
import { RuntimeEnvironment } from '../infrastructure/config/RuntimeEnvironment.ts';
import { FirebaseConfig } from '../infrastructure/firebase/config/FirebaseConfig.ts';
import { assert, assertEquals, assertThrows, TestRunner } from './testUtils.ts';

/**
 * Regression suite for the authentication fail-open.
 *
 * Historical failure condition: `FirebaseConfig.getProvider()` returned 'mock'
 * for any value of INFRASTRUCTURE_PROVIDER that was not exactly 'firebase', with
 * no environment awareness. Mock mode installs MockAuthTokenVerifier, whose
 * seeded 'test-token-staff-manager' grants ['workshop_manager','admin']. A
 * production deployment with the variable unset, empty, misspelled or
 * whitespace-padded therefore served full administrative access to anonymous
 * visitors.
 *
 * Every test below fails against the pre-fix implementation.
 */

/**
 * Applies environment overrides for the duration of `fn` and restores the prior
 * values unconditionally. These tests mutate process-wide state inside a shared
 * test process, so restoration must happen even when `fn` throws.
 */
async function withEnv(
  overrides: Record<string, string | undefined>,
  fn: () => void | Promise<void>
): Promise<void> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key];
    const next = overrides[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(previous)) {
      const prior = previous[key];
      if (prior === undefined) delete process.env[key];
      else process.env[key] = prior;
    }
  }
}

const PRODUCTION_ONLY = {
  NODE_ENV: 'production',
  PRODUCTION_ARTIFACT: undefined,
} as const;

export async function runProductionAuthSafetyTests(runner: TestRunner): Promise<void> {
  runner.suite('Production Authentication Safety (fail-closed)', () => {});

  await runner.test(
    'production with NO provider configuration refuses to build a container',
    async () => {
      await withEnv({ ...PRODUCTION_ONLY, INFRASTRUCTURE_PROVIDER: undefined }, async () => {
        await assertThrows(() => createApplicationContainer(), 'Refusing to start');
      });
    }
  );

  await runner.test('production with a MISSPELLED provider refuses to build a container', async () => {
    await withEnv({ ...PRODUCTION_ONLY, INFRASTRUCTURE_PROVIDER: 'firbase' }, async () => {
      await assertThrows(() => createApplicationContainer(), 'Refusing to start');
    });
  });

  await runner.test('production with an EMPTY provider refuses to build a container', async () => {
    await withEnv({ ...PRODUCTION_ONLY, INFRASTRUCTURE_PROVIDER: '' }, async () => {
      await assertThrows(() => createApplicationContainer(), 'Refusing to start');
    });
  });

  await runner.test(
    'production refuses EXPLICIT mock mode, which bypasses getProvider() entirely',
    async () => {
      // container.ts resolves `options?.mode || getProvider()`, so a guard placed
      // inside FirebaseConfig alone would leave this path wide open.
      await withEnv({ ...PRODUCTION_ONLY, INFRASTRUCTURE_PROVIDER: 'firebase' }, async () => {
        await assertThrows(() => createApplicationContainer({ mode: 'mock' }), 'Refusing to start');
      });
    }
  );

  await runner.test(
    'a BUILT ARTIFACT is production even when NODE_ENV is unset',
    async () => {
      // The load-bearing case. Nothing in this repository ever sets NODE_ENV -
      // not the start script, no Dockerfile, no CI - so a guard keyed only on
      // NODE_ENV would have been inert on exactly the deployment it exists to
      // protect. `npm run build` bakes PRODUCTION_ARTIFACT into dist/server.cjs.
      await withEnv(
        { NODE_ENV: undefined, APP_ENV: undefined, PRODUCTION_ARTIFACT: 'true', INFRASTRUCTURE_PROVIDER: undefined },
        async () => {
          assert(RuntimeEnvironment.isProduction(), 'a built artifact must resolve as production');
          await assertThrows(() => createApplicationContainer(), 'Refusing to start');
        }
      );
    }
  );

  await runner.test(
    'MockAuthTokenVerifier cannot be constructed in production (defence in depth)',
    async () => {
      await withEnv(PRODUCTION_ONLY, async () => {
        await assertThrows(() => new MockAuthTokenVerifier(), 'must never be constructed');
      });
    }
  );

  await runner.test('getProvider() tolerates surrounding whitespace', async () => {
    // A YAML/Helm/`docker run -e` value carrying a stray space previously
    // degraded silently to mock. Lowercasing was already handled; trimming was not.
    await withEnv({ INFRASTRUCTURE_PROVIDER: '  firebase  ' }, () => {
      assertEquals(FirebaseConfig.getProvider(), 'firebase');
    });
    await withEnv({ INFRASTRUCTURE_PROVIDER: ' FIREBASE' }, () => {
      assertEquals(FirebaseConfig.getProvider(), 'firebase');
    });
  });

  await runner.test('getProvider() still resolves unknown values to mock', async () => {
    await withEnv({ INFRASTRUCTURE_PROVIDER: 'postgres' }, () => {
      assertEquals(FirebaseConfig.getProvider(), 'mock');
    });
  });

  await runner.test('RuntimeEnvironment classifies non-production environments correctly', async () => {
    await withEnv({ NODE_ENV: undefined, APP_ENV: undefined, PRODUCTION_ARTIFACT: undefined }, () => {
      assertEquals(RuntimeEnvironment.isProduction(), false, 'unset environment is not production');
    });
    await withEnv({ NODE_ENV: 'development', PRODUCTION_ARTIFACT: undefined }, () => {
      assertEquals(RuntimeEnvironment.isProduction(), false);
    });
    await withEnv({ NODE_ENV: 'test', PRODUCTION_ARTIFACT: undefined }, () => {
      assertEquals(RuntimeEnvironment.isProduction(), false);
    });
    await withEnv({ NODE_ENV: ' Production ', PRODUCTION_ARTIFACT: undefined }, () => {
      assertEquals(RuntimeEnvironment.isProduction(), true, 'padded/cased production must still count');
    });
  });

  await runner.test(
    'development/test mock authentication still works under its intended configuration',
    async () => {
      // The hardening must not remove legitimate local development capability.
      const container = createApplicationContainer();
      assertEquals(container.mode, 'mock');
      assert(
        container.authVerifier instanceof MockAuthTokenVerifier,
        'dev/test must still install the mock verifier'
      );
      const identity = await container.authVerifier.verifyToken('test-token-staff-manager');
      assertEquals(identity.uid, 'firebase_uid_manager_khalid');
      assert(identity.roles!.includes('admin'), 'seeded manager token still grants admin in dev');
    }
  );

  await runner.test('an unknown bearer token is rejected by the mock verifier', async () => {
    const container = createApplicationContainer();
    await assertThrows(
      () => container.authVerifier.verifyToken('not-a-real-token'),
      'Invalid or untrusted authentication token'
    );
  });

  await runner.test('unauthenticated request to a protected staff endpoint returns 401', async () => {
    const container = createApplicationContainer({ mode: 'mock' });
    const app = createExpressApp(container);
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as { port: number }).port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/internal/jobs`);
      assertEquals(res.status, 401);
      const body = (await res.json()) as { error: { code: string } };
      assertEquals(body.error.code, 'AUTHENTICATION_REQUIRED');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
}
