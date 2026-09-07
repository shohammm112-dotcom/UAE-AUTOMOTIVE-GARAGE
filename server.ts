import 'dotenv/config';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApplicationContainer } from './src/infrastructure/di/container.ts';
import { createExpressApp } from './src/server/app.ts';
import { RuntimeEnvironment } from './src/infrastructure/config/RuntimeEnvironment.ts';

async function startServer() {
  const container = createApplicationContainer();

  // DEMO FIXTURE — development only, and only over mock infrastructure.
  // Mock repositories start empty and reset on restart, and there is still no job-creation
  // path in the application (debt #36), so without this a fresh instance has nothing to show.
  // Double-gated: never in production, and never against real Firestore data. Opt out with
  // DEMO_SEED=false. The dynamic import keeps the fixture out of a production artifact.
  if (!RuntimeEnvironment.isProduction() && container.mode === 'mock' && process.env.DEMO_SEED !== 'false') {
    const { seedDemoData } = await import('./src/infrastructure/mock/DemoSeed.ts');
    await seedDemoData(container.repositories);
    console.log('[demo-seed] Loaded demo scenario (Sanjeev Bhatia / Nissan Patrol Super Safari).');
  }

  const app = createExpressApp(container);
  const PORT = 3000;

  // SECURITY: in non-production this mounts Vite in middleware mode, which serves
  // the raw source tree - including src/infrastructure/mock/MockAuthTokenVerifier.ts
  // and its seeded credentials. Keyed on RuntimeEnvironment rather than NODE_ENV
  // because nothing sets NODE_ENV, so a built artifact previously took this branch.
  if (!RuntimeEnvironment.isProduction()) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UAE Garage Digital Platform Server running on http://0.0.0.0:${PORT} [mode: ${container.mode}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
