import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { TelemetryPacketSchema } from '../dto/telemetry.dto';
import { telemetryIngestionService } from '../services/telemetry-ingestion.service';
import { eventBus } from '../events/event-bus';
import { DomainEvents, TelemetryValidatedPayload } from '../events/domain-events';
import { ZodError } from 'zod';
import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';
import { traceContextStorage } from '../observability/tracing';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export function setupWebSocketServer(server: any) {
  // Use noServer manually to handle upgrade, allowing NestJS to coexist without path collisions
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: any, socket: any, head: any) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '/';
    
    if (pathname === '/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Else: let other handlers (like NestJS Gateway) handle the upgrade
  });

  // Stale connection cleanup loop
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        logger.warn('[WS] Terminating stale connection ping timeout', { event: 'WS_STALE_TERMINATE' });
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Generate correlation context for this connection
    const traceId = req.headers['x-correlation-id'] as string || uuidv4();
    
    traceContextStorage.run({ traceId }, () => {
      metrics.incrementGauge('websocket_connections_active', 1);
      
      // Setup heartbeat
      (ws as any).isAlive = true;
      ws.on('pong', () => {
        (ws as any).isAlive = true;
      });

      console.log('[WS] Client attempting connection');

    // 1. WebSocket Authentication
    /*const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.log('[WS] Rejected: No token provided');
      ws.close(1008, 'Token required');
      return;
    }
*/
    let userId: string = "usuario_debug_123"; 
    console.log(`[WS] Bypass de seguridad activo. Conectado como: ${userId}`);
    /*try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
      console.log(`[WS] Authenticated successfully for user: ${userId}`);
    } catch (err) {
      console.log('[WS] Rejected: Invalid token');
      ws.close(1008, 'Invalid token');
      return;
    }
*/
    // 2. Incoming Message Handler Pipeline
    ws.on('message', (message: string) => {
      try {
        const rawData = JSON.parse(message);

        // Zod validation (structural + type boundaries)
        const parsedPacket = TelemetryPacketSchema.parse(rawData);

        // Hand off to highly scalable ingestion pipeline (Service Layer)
        // This decouples the WS handler from business rules and persistence!
        if (parsedPacket.type === 'TELEMETRY_INGEST') {
            telemetryIngestionService.ingest(userId, parsedPacket.payload);
        }

      } catch (err) {
        if (err instanceof ZodError) {
          // Reject malformed schemas without killing the connection immediately (or optionally close it)
          console.warn(`[WS] Malformed packet from ${userId}`, (err as ZodError<any>).issues);
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Malformed telemetry packet' }));
        } else {
          console.error(`[WS] Message processing error`, err);
        }
      }
    });

    ws.on('close', () => {
      logger.info(`[WS] Connection closed for user: ${userId}`, { event: 'WS_CLOSE', userId });
      metrics.decrementGauge('websocket_connections_active', 1);
      telemetryIngestionService.cleanSession(userId);
      eventBus.unsubscribe?.(DomainEvents.TelemetryValidated, clientProcessedListener);
    });

    // 3. Outgoing Broadcast (Echo)
    // By subscribing to the Domain Event bus directly, the WebSocket transport layer
    // acts simply as just another consumer of Validated Telemetry!
    const clientProcessedListener = (data: TelemetryValidatedPayload) => {
        if (data.userId === userId && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'TELEMETRY_UPDATE', payload: data }));
        }
    };
    
    eventBus.subscribe<TelemetryValidatedPayload>(DomainEvents.TelemetryValidated, clientProcessedListener);
    }); // Close traceContextStorage.run
  });
}
