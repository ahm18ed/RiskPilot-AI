import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/api';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureProductionBuild() {
  const distIndex = path.resolve(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) return;

  const { build } = await import('vite');
  await build({
    configFile: path.resolve(__dirname, 'vite.config.ts'),
    logLevel: 'warn'
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount backend API routes
  app.use('/api', apiRouter);

  if (!isProduction) {
    // In development mode, mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    await ensureProductionBuild();

    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RiskPilot AI] Server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[RiskPilot AI] Failed to start server:', err);
  process.exit(1);
});
