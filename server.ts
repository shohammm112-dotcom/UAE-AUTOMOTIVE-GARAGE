import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApplicationContainer } from './src/infrastructure/di/container.ts';
import { createExpressApp } from './src/server/app.ts';

async function startServer() {
  const container = createApplicationContainer();
  const app = createExpressApp(container);
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
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
