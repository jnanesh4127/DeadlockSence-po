import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import express from 'express';
import { createApp } from './server/src/app.ts';

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;
  const distPath = path.resolve(process.cwd(), 'dist');
  const isTsx = process.execArgv.some((arg) => arg.includes('tsx'));
  const isProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    (!isTsx && process.env.NODE_ENV !== 'development' && fs.existsSync(path.join(distPath, 'index.html')));

  if (!isProd) {
    // Development mode: Mount Vite dev middleware directly
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log("[Dev Server] Vite dev middleware mounted.");
  } else {
    // Production mode: Serve built client assets
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Prod Server] Serving production bundle from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DeadlockSense] Unified Full-Stack Application listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
