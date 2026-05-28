import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
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

  // JSON body parser
  app.use(express.json());

  // Use modular routers
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

  // Create HTTP server attached to express app
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node-Express server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket server for real-time telemetry Phase 1
  const { WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to real-time telemetry stream');
    
    // Simulate real-time streaming of BPM baseline data for Phase 1
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'TELEMETRY_UPDATE', 
          payload: { bpm: 70 + Math.floor(Math.random() * 8), timestamp: Date.now() } 
        }));
      }
    }, 2000);

    ws.on('close', () => {
      console.log('Client disconnected from telemetry stream');
      clearInterval(interval);
    });
  });
}

startServer();
