import 'dotenv/config';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApplicationContainer } from './src/infrastructure/di/container.ts';
import { createExpressApp } from './src/server/app.ts';
import { RuntimeEnvironment } from './src/infrastructure/config/RuntimeEnvironment.ts';

async function startServer() {
  const container = createApplicationContainer();
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
