import 'dotenv/config';

import { setupTracing } from './server/observability/tracing';
setupTracing();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './server/nest-scaffold/app.module';

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/index';
import { errorHandler } from './server/middlewares/errorHandler';
import cors from 'cors';
import { registerEventConsumers } from './server/events';
import geminiRoutes from './server/routes/gemini';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS & JSON body parser
  app.use(cors());
  app.use(express.json());

  // Use modular routers
  app.use('/api', apiRoutes); 
  app.use('/api/gemini', geminiRoutes);
  

  // Serve static assets / development routes with Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  // Initialize Internal Event Consumers
  registerEventConsumers();

  console.log('Bootstrapping Hybrid NestJS Runtime...');
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(app));
  nestApp.useWebSocketAdapter(new WsAdapter(nestApp));
  nestApp.enableShutdownHooks();
  await nestApp.init();

  // Create HTTP server attached to express app
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node-Express-NestJS Hybrid Server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket server for real-time telemetry Pipeline
  const { setupWebSocketServer } = await import('./server/ws/telemetry.handler');
  setupWebSocketServer(server);

  // Graceful Shutdown for Kubernetes (SIGTERM)
  process.on('SIGTERM', async () => {
    console.log('[Orchestrator] SIGTERM received. Initiating graceful shutdown...');
    await nestApp.close();
    server.close(() => {
      console.log('[Orchestrator] Legacy HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer();