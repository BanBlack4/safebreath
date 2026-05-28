import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import apiRoutes from "./server/routes/index";
import { errorHandler } from "./server/middlewares/errorHandler";
import cors from "cors";
import { registerEventConsumers } from "./server/events";

dotenv.config();
import * as admin from 'firebase-admin';

import geminiRoutes from "./server/routes/gemini";
import firebaseRoutes from "./server/routes/firebase";

dotenv.config();

// Initialize Firebase Admin for Firebase Cloud Messaging (FCM)
// Required for sending Push Notifications
try {
  admin.initializeApp({
    projectId: "tensile-lens-l8gvj",
  });
  console.log("Firebase Admin initialized for Cloud Messaging");
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS & JSON body parser
  app.use(cors());
  app.use(express.json());

  // Use modular routers
  app.use('/api', apiRoutes); // Our new scalable abstraction
  app.use('/api/gemini', geminiRoutes);
  app.use('/api/firebase', firebaseRoutes);

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use(errorHandler);

  // Initialize Internal Event Consumers
  registerEventConsumers();

  // Create HTTP server attached to express app
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node-Express server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket server for real-time telemetry Pipeline
  const { setupWebSocketServer } = await import('./server/ws/telemetry.handler');
  setupWebSocketServer(server);

  // Graceful Shutdown for Kubernetes (SIGTERM)
  process.on('SIGTERM', () => {
    console.log('[Orchestrator] SIGTERM received. Initiating graceful shutdown...');
    // Stop accepting new connections
    server.close(() => {
      console.log('[Orchestrator] HTTP server closed.');
      // Exit cleanly after buffers flush and connections close
      process.exit(0);
    });
  });
}

startServer();
