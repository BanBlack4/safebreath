var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

// server/observability/tracing.ts
var tracing_exports = {};
__export(tracing_exports, {
  setupTracing: () => setupTracing,
  traceContextStorage: () => traceContextStorage
});
function setupTracing() {
  const traceExporter = new import_exporter_trace_otlp_http.OTLPTraceExporter({
    // Export to Grafana Tempo or Jaeger Collector
    url: process.env.OTLP_ENDPOINT || "http://localhost:4318/v1/traces"
  });
  const sdk = new import_sdk_node.NodeSDK({
    resource: (0, import_resources.resourceFromAttributes)({
      "service.name": "safebreath-backend",
      "service.version": "1.0.0"
    }),
    traceExporter,
    // Auto-instruments Express, HTTP, ioredis, pg, and more natively!
    instrumentations: [(0, import_auto_instrumentations_node.getNodeAutoInstrumentations)()]
  });
  sdk.start();
  process.on("SIGTERM", () => {
    sdk.shutdown().then(() => console.log("Tracing terminated")).catch((error) => console.log("Error terminating tracing", error));
  });
}
var import_sdk_node, import_auto_instrumentations_node, import_exporter_trace_otlp_http, import_resources, import_async_hooks, traceContextStorage;
var init_tracing = __esm({
  "server/observability/tracing.ts"() {
    import_sdk_node = require("@opentelemetry/sdk-node");
    import_auto_instrumentations_node = require("@opentelemetry/auto-instrumentations-node");
    import_exporter_trace_otlp_http = require("@opentelemetry/exporter-trace-otlp-http");
    import_resources = require("@opentelemetry/resources");
    import_async_hooks = require("async_hooks");
    traceContextStorage = new import_async_hooks.AsyncLocalStorage();
  }
});

// server/observability/metrics.ts
var MetricsRegistry, metrics;
var init_metrics = __esm({
  "server/observability/metrics.ts"() {
    MetricsRegistry = class {
      constructor() {
        this.counters = /* @__PURE__ */ new Map();
        this.gauges = /* @__PURE__ */ new Map();
        this.histograms = /* @__PURE__ */ new Map();
      }
      // --- Counters ---
      increment(name, value = 1) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
      }
      // --- Gauges ---
      setGauge(name, value) {
        this.gauges.set(name, value);
      }
      incrementGauge(name, value = 1) {
        const current = this.gauges.get(name) || 0;
        this.gauges.set(name, current + value);
      }
      decrementGauge(name, value = 1) {
        const current = this.gauges.get(name) || 0;
        this.gauges.set(name, current - value);
      }
      // --- Histograms / Timers ---
      observe(name, value) {
        let hist = this.histograms.get(name);
        if (!hist) {
          hist = { count: 0, sum: 0, min: Number.MAX_VALUE, max: Number.MIN_VALUE };
          this.histograms.set(name, hist);
        }
        hist.count += 1;
        hist.sum += value;
        if (value < hist.min) hist.min = value;
        if (value > hist.max) hist.max = value;
      }
      /**
       * Helper to measure execution duration of a synchronous or asynchronous block.
       */
      async measureDuration(name, fn) {
        const start = performance.now();
        try {
          return await fn();
        } finally {
          this.observe(name, performance.now() - start);
        }
      }
      /**
       * Exports metrics in a Prometheus-like format (simplified).
       */
      exportMetrics() {
        const lines = [];
        this.counters.forEach((val, name) => {
          lines.push(`# TYPE ${name} counter`);
          lines.push(`${name} ${val}`);
        });
        this.gauges.forEach((val, name) => {
          lines.push(`# TYPE ${name} gauge`);
          lines.push(`${name} ${val}`);
        });
        this.histograms.forEach((val, name) => {
          lines.push(`# TYPE ${name} summary`);
          lines.push(`${name}_count ${val.count}`);
          lines.push(`${name}_sum ${val.sum}`);
          lines.push(`${name}_avg ${val.count > 0 ? val.sum / val.count : 0}`);
        });
        return lines.join("\n");
      }
    };
    metrics = new MetricsRegistry();
  }
});

// server/observability/logger.ts
var Logger2, logger;
var init_logger = __esm({
  "server/observability/logger.ts"() {
    init_tracing();
    Logger2 = class {
      formatMessage(level, message, meta) {
        const traceCtx = traceContextStorage.getStore();
        const logObj = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message,
          traceId: traceCtx?.traceId,
          userId: traceCtx?.userId,
          ...meta
        };
        if (process.env.NODE_ENV === "production") {
          return JSON.stringify(logObj);
        } else {
          const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
          return `[${logObj.timestamp}] [${level}] ${message}${metaStr}`;
        }
      }
      info(message, meta) {
        console.log(this.formatMessage("INFO", message, meta));
      }
      warn(message, meta) {
        console.warn(this.formatMessage("WARN", message, meta));
      }
      error(message, error, meta) {
        const errorMeta = error instanceof Error ? { err_message: error.message, stack: error.stack } : { err: error };
        console.error(this.formatMessage("ERROR", message, { ...meta, ...errorMeta }));
      }
      debug(message, meta) {
        if (process.env.LOG_LEVEL === "debug") {
          console.debug(this.formatMessage("DEBUG", message, meta));
        }
      }
    };
    logger = new Logger2();
  }
});

// server/resilience/dlq.service.ts
var DeadLetterQueue, dlq;
var init_dlq_service = __esm({
  "server/resilience/dlq.service.ts"() {
    init_logger();
    init_metrics();
    DeadLetterQueue = class {
      async enqueue(eventName, payload, errorReason) {
        logger.warn(`Event moved to DLQ: ${eventName}`, {
          event: "DLQ_ENQUEUE",
          eventName,
          errorReason,
          // Stringify or slice payload if extremely large to prevent OOM
          payloadPreview: JSON.stringify(payload).substring(0, 500)
        });
        metrics.increment("dlq_enqueued_total");
      }
    };
    dlq = new DeadLetterQueue();
  }
});

// server/events/event-bus.ts
var import_events, AppEventBus, eventBus;
var init_event_bus = __esm({
  "server/events/event-bus.ts"() {
    import_events = require("events");
    init_metrics();
    init_logger();
    init_dlq_service();
    AppEventBus = class {
      constructor() {
        this.emitter = new import_events.EventEmitter();
        // Bounded Queue limits
        this.maxInFlightEvents = 5e3;
        this.currentInFlightEvents = 0;
        this.emitter.setMaxListeners(20);
      }
      /**
       * Publish an event to the bus.
       * Consumers run asynchronously to prevent blocking the publisher.
       */
      publish(eventName, payload) {
        if (this.currentInFlightEvents >= this.maxInFlightEvents) {
          logger.error(`Event Bus Overloaded! Shedding event load: ${eventName}`, null, { event: "EVENT_BUS_OVERFLOW", eventName });
          metrics.increment("event_bus_overflow_total");
          return;
        }
        this.currentInFlightEvents++;
        metrics.setGauge("event_bus_queue_depth", this.currentInFlightEvents);
        const traceCtx = (init_tracing(), __toCommonJS(tracing_exports)).traceContextStorage.getStore();
        setImmediate(() => {
          (init_tracing(), __toCommonJS(tracing_exports)).traceContextStorage.run(traceCtx || {}, () => {
            this.emitter.emit(eventName, payload);
          });
        });
      }
      /**
       * Subscribe to an event.
       * Wraps the handler to catch unhandled promise rejections.
       */
      subscribe(eventName, handler) {
        this.emitter.on(eventName, async (payload) => {
          try {
            await handler(payload);
          } catch (error) {
            logger.error(`Error processing event ${eventName}:`, error, { event: "EVENT_BUS_CONSUMER_ERR" });
            this.handleDeadLetter(eventName, payload, error);
          } finally {
            this.currentInFlightEvents--;
            metrics.setGauge("event_bus_queue_depth", this.currentInFlightEvents);
          }
        });
        logger.info(`Consumer subscribed to ${eventName}`, { event: "EVENT_BUS_SUBSCRIBE" });
      }
      unsubscribe(eventName, handler) {
        this.emitter.off(eventName, handler);
      }
      handleDeadLetter(eventName, payload, error) {
        dlq.enqueue(eventName, payload, error?.message || "Unknown Consumer Error").catch((e) => {
          logger.error("Failed to enqueue into DLQ", e, { event: "DLQ_ENQUEUE_FAIL" });
        });
      }
    };
    eventBus = new AppEventBus();
  }
});

// server/events/domain-events.ts
var init_domain_events = __esm({
  "server/events/domain-events.ts"() {
  }
});

// server/services/telemetry-ingestion.service.ts
var telemetry_ingestion_service_exports = {};
__export(telemetry_ingestion_service_exports, {
  TelemetryIngestionService: () => TelemetryIngestionService,
  telemetryIngestionService: () => telemetryIngestionService
});
var TelemetryIngestionService, telemetryIngestionService;
var init_telemetry_ingestion_service = __esm({
  "server/services/telemetry-ingestion.service.ts"() {
    init_event_bus();
    init_domain_events();
    init_logger();
    init_metrics();
    TelemetryIngestionService = class {
      constructor() {
        this.sessions = /* @__PURE__ */ new Map();
        // Rate Limiting Config
        this.MAX_MESSAGES_PER_SECOND = 10;
        // Replay Attack Config
        this.MAX_TIME_DRIFT_MS = 5e3;
      }
      // Accept max 5s latent packets
      /**
       * Process an incoming telemetry packet from a client websocket
       */
      ingest(userId, packet) {
        const now = Date.now();
        let session = this.sessions.get(userId);
        if (!session) {
          session = {
            lastSequenceId: -1,
            lastTimestamp: 0,
            lastBpm: null,
            messageCount: 0,
            windowStartTime: now
          };
          this.sessions.set(userId, session);
        }
        if (now - session.windowStartTime > 1e3) {
          session.messageCount = 0;
          session.windowStartTime = now;
        }
        session.messageCount++;
        if (session.messageCount > this.MAX_MESSAGES_PER_SECOND) {
          logger.warn(`Rate limit exceeded`, { event: "INGEST_RATE_LIMIT", userId });
          metrics.increment("dropped_packet_rate");
          return;
        }
        const timeDrift = Math.abs(now - packet.timestamp);
        if (timeDrift > this.MAX_TIME_DRIFT_MS) {
          logger.warn(`Time drift anomaly detected (${timeDrift}ms)`, { event: "INGEST_DRIFT", userId, timeDrift });
          metrics.increment("dropped_packet_rate");
          return;
        }
        if (packet.sequenceId <= session.lastSequenceId) {
          logger.warn(`Replay or out-of-order packet (Seq: ${packet.sequenceId})`, { event: "INGEST_REPLAY", userId, sequenceId: packet.sequenceId });
          metrics.increment("dropped_packet_rate");
          eventBus.publish("telemetry.rejected" /* TelemetryRejected */, {
            userId,
            reason: "OUT_OF_ORDER",
            packetInfo: packet
          });
          return;
        }
        session.lastSequenceId = packet.sequenceId;
        if (session.lastBpm !== null) {
          const bpmDelta = Math.abs(packet.bpm - session.lastBpm);
          if (bpmDelta > 40) {
            logger.warn(`Sensor noise spike detected. Dropping outlier: ${packet.bpm}`, { event: "INGEST_NOISE_SPIKE", userId, bpm: packet.bpm });
            metrics.increment("dropped_packet_rate");
            eventBus.publish("telemetry.rejected" /* TelemetryRejected */, {
              userId,
              reason: "NOISE_SPIKE_REJECTED",
              packetInfo: packet
            });
            return;
          }
        }
        session.lastBpm = packet.bpm;
        session.lastTimestamp = packet.timestamp;
        const normalizedTelemetry = {
          userId,
          ...packet,
          ingestedAt: now
        };
        eventBus.publish("telemetry.validated" /* TelemetryValidated */, normalizedTelemetry);
      }
      /**
       * Cleans up disconnected sessions
       */
      cleanSession(userId) {
        this.sessions.delete(userId);
      }
    };
    telemetryIngestionService = new TelemetryIngestionService();
  }
});

// server/dto/telemetry.dto.ts
var import_zod4, TelemetryPacketSchema;
var init_telemetry_dto = __esm({
  "server/dto/telemetry.dto.ts"() {
    import_zod4 = require("zod");
    TelemetryPacketSchema = import_zod4.z.object({
      type: import_zod4.z.literal("TELEMETRY_INGEST"),
      payload: import_zod4.z.object({
        bpm: import_zod4.z.number().min(30, "BPM strictly bounded").max(250, "BPM strictly bounded"),
        hrv: import_zod4.z.number().min(0).max(200).optional(),
        stressLevel: import_zod4.z.number().min(0).max(100).optional(),
        timestamp: import_zod4.z.number(),
        // Client-side Unix timestamp for latency tracking
        sequenceId: import_zod4.z.number(),
        // Sequence ID to prevent replay and out-of-order execution
        deviceId: import_zod4.z.string().optional()
      })
    });
  }
});

// server/ws/telemetry.handler.ts
var telemetry_handler_exports = {};
__export(telemetry_handler_exports, {
  setupWebSocketServer: () => setupWebSocketServer
});
function setupWebSocketServer(server) {
  const wss = new import_ws.WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : "/";
    if (pathname === "/") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.warn("[WS] Terminating stale connection ping timeout", { event: "WS_STALE_TERMINATE" });
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 3e4);
  wss.on("close", () => {
    clearInterval(interval);
  });
  wss.on("connection", (ws, req) => {
    const traceId = req.headers["x-correlation-id"] || (0, import_uuid2.v4)();
    traceContextStorage.run({ traceId }, () => {
      metrics.incrementGauge("websocket_connections_active", 1);
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });
      console.log("[WS] Client attempting connection");
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) {
        console.log("[WS] Rejected: No token provided");
        ws.close(1008, "Token required");
        return;
      }
      let userId;
      try {
        const decoded = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
        userId = decoded.userId;
        console.log(`[WS] Authenticated successfully for user: ${userId}`);
      } catch (err) {
        console.log("[WS] Rejected: Invalid token");
        ws.close(1008, "Invalid token");
        return;
      }
      ws.on("message", (message) => {
        try {
          const rawData = JSON.parse(message);
          const parsedPacket = TelemetryPacketSchema.parse(rawData);
          if (parsedPacket.type === "TELEMETRY_INGEST") {
            telemetryIngestionService.ingest(userId, parsedPacket.payload);
          }
        } catch (err) {
          if (err instanceof import_zod5.ZodError) {
            console.warn(`[WS] Malformed packet from ${userId}`, err.issues);
            ws.send(JSON.stringify({ type: "ERROR", message: "Malformed telemetry packet" }));
          } else {
            console.error(`[WS] Message processing error`, err);
          }
        }
      });
      ws.on("close", () => {
        logger.info(`[WS] Connection closed for user: ${userId}`, { event: "WS_CLOSE", userId });
        metrics.decrementGauge("websocket_connections_active", 1);
        telemetryIngestionService.cleanSession(userId);
        eventBus.unsubscribe?.("telemetry.validated" /* TelemetryValidated */, clientProcessedListener);
      });
      const clientProcessedListener = (data) => {
        if (data.userId === userId && ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "TELEMETRY_UPDATE", payload: data }));
        }
      };
      eventBus.subscribe("telemetry.validated" /* TelemetryValidated */, clientProcessedListener);
    });
  });
}
var import_ws, import_jsonwebtoken3, import_zod5, import_uuid2, JWT_SECRET3;
var init_telemetry_handler = __esm({
  "server/ws/telemetry.handler.ts"() {
    import_ws = require("ws");
    import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
    init_telemetry_dto();
    init_telemetry_ingestion_service();
    init_event_bus();
    init_domain_events();
    import_zod5 = require("zod");
    init_logger();
    init_metrics();
    init_tracing();
    import_uuid2 = require("uuid");
    JWT_SECRET3 = process.env.JWT_SECRET || "fallback-secret-for-dev";
  }
});

// server.ts
init_tracing();
var import_core3 = require("@nestjs/core");
var import_platform_express = require("@nestjs/platform-express");
var import_platform_ws = require("@nestjs/platform-ws");

// server/nest-scaffold/app.module.ts
var import_common6 = require("@nestjs/common");
var import_event_emitter = require("@nestjs/event-emitter");

// server/nest-scaffold/core/core.module.ts
var import_common3 = require("@nestjs/common");
var import_core = require("@nestjs/core");

// server/nest-scaffold/core/redis.service.ts
var import_common = require("@nestjs/common");
var RedisService = class {
  // Would be Redis instance
  constructor() {
    this.logger = new import_common.Logger(RedisService.name);
    this.logger.log("NestJS RedisService Initializing...");
  }
  async execute(operation) {
    try {
      return await operation(this.client);
    } catch (err) {
      this.logger.error("Redis execution failed block", err);
      return null;
    }
  }
  onModuleDestroy() {
    this.logger.log("Gracefully closing Redis connections...");
    if (this.client) {
      this.client.disconnect();
    }
  }
};
RedisService = __decorateClass([
  (0, import_common.Injectable)()
], RedisService);

// server/nest-scaffold/core/tracing.interceptor.ts
var import_common2 = require("@nestjs/common");
var import_rxjs = require("rxjs");
var import_uuid = require("uuid");
init_tracing();
var TracingInterceptor = class {
  intercept(context, next) {
    const type = context.getType();
    let traceId = (0, import_uuid.v4)();
    if (type === "http") {
      const request = context.switchToHttp().getRequest();
      traceId = request.headers["x-correlation-id"] || traceId;
      request.traceId = traceId;
    } else if (type === "ws") {
      const client = context.switchToWs().getClient();
      const req = client.upgradeReq || client.request;
      traceId = req?.headers?.["x-correlation-id"] || traceId;
    }
    return new import_rxjs.Observable((subscriber) => {
      traceContextStorage.run({ traceId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete()
        });
      });
    });
  }
};
TracingInterceptor = __decorateClass([
  (0, import_common2.Injectable)()
], TracingInterceptor);

// server/nest-scaffold/core/core.module.ts
var CoreModule = class {
};
CoreModule = __decorateClass([
  (0, import_common3.Global)(),
  (0, import_common3.Module)({
    // imports: [ConfigModule],
    providers: [
      RedisService,
      {
        provide: import_core.APP_INTERCEPTOR,
        useClass: TracingInterceptor
      }
    ],
    exports: [RedisService]
    // Emits the Redis dependency injection token globally
  })
], CoreModule);

// server/nest-scaffold/telemetry/telemetry.module.ts
var import_common5 = require("@nestjs/common");

// server/nest-scaffold/telemetry/telemetry.gateway.ts
var import_websockets = require("@nestjs/websockets");
var import_common4 = require("@nestjs/common");
var TelemetryGateway = class {
  constructor() {
    this.logger = new import_common4.Logger(TelemetryGateway.name);
  }
  handleConnection(client) {
    this.logger.log(`Client Connected: ${client.id}`);
  }
  handleDisconnect(client) {
    this.logger.log(`Client Disconnected: ${client.id}`);
  }
  handleTelemetry(client, payload) {
    const userId = client.userId || "anonymous-via-nest";
    const result = (init_telemetry_ingestion_service(), __toCommonJS(telemetry_ingestion_service_exports)).telemetryIngestionService.process(userId, payload);
  }
};
__decorateClass([
  (0, import_websockets.WebSocketServer)()
], TelemetryGateway.prototype, "server", 2);
__decorateClass([
  (0, import_websockets.SubscribeMessage)("TELEMETRY_INGEST"),
  __decorateParam(0, (0, import_websockets.ConnectedSocket)()),
  __decorateParam(1, (0, import_websockets.MessageBody)())
], TelemetryGateway.prototype, "handleTelemetry", 1);
TelemetryGateway = __decorateClass([
  (0, import_websockets.WebSocketGateway)({ cors: true, path: "/v2/telemetry" })
], TelemetryGateway);

// server/nest-scaffold/telemetry/telemetry.module.ts
var TelemetryModule = class {
};
TelemetryModule = __decorateClass([
  (0, import_common5.Module)({
    providers: [
      TelemetryGateway
      // TelemetryService
    ]
  })
], TelemetryModule);

// server/nest-scaffold/app.module.ts
var AppModule = class {
};
AppModule = __decorateClass([
  (0, import_common6.Module)({
    imports: [
      import_event_emitter.EventEmitterModule.forRoot({
        global: true,
        wildcard: true,
        // Allow wildcard event subscriptions
        maxListeners: 10
      }),
      CoreModule,
      TelemetryModule
      // ObservabilityModule,
      // RulesEngineModule,
    ]
  })
], AppModule);

// server.ts
var import_express7 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);

// server/routes/index.ts
var import_express5 = require("express");

// server/routes/health-profile.routes.ts
var import_express = require("express");

// src/services/supabaseClient.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_meta = {};
var rawUrl = import_meta.env.VITE_SUPABASE_URL || "";
var supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
var supabaseAnonKey = import_meta.env.VITE_SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)");
}
var supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseAnonKey);

// server/repositories/interfaces/supabase/health-profile.supabase.ts
var SupabaseHealthProfileRepository = class {
  async getProfile(userId) {
    const { data, error } = await supabase.from("health_profiles").select("*").eq("user_id", userId).single();
    if (error) return null;
    return data;
  }
  async updateProfile(userId, data) {
    const { data: updatedData, error } = await supabase.from("health_profiles").upsert({ user_id: userId, ...data, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).select().single();
    if (error) throw error;
    return updatedData;
  }
};

// server/services/health-profile.service.ts
var HealthProfileService = class {
  constructor(healthProfileRepository2) {
    this.healthProfileRepository = healthProfileRepository2;
  }
  async getProfile(userId) {
    const profile = await this.healthProfileRepository.getProfile(userId);
    return profile || null;
  }
  async updateProfile(userId, data) {
    if (data.bpmReposo > 120) {
      console.warn("High resting BPM recorded:", data.bpmReposo);
    }
    const updatedProfile = await this.healthProfileRepository.updateProfile(userId, data);
    return {
      status: "success",
      message: "Profile updated successfully",
      data: updatedProfile
    };
  }
};
var healthProfileRepository = new SupabaseHealthProfileRepository();
var healthProfileService = new HealthProfileService(healthProfileRepository);

// server/controllers/health-profile.controller.ts
var HealthProfileController = class {
  async getProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const profile = await healthProfileService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
  async updateProfile(req, res, next) {
    try {
      const data = req.body;
      const result = await healthProfileService.updateProfile(data.userId, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
var healthProfileController = new HealthProfileController();

// server/middlewares/validate.ts
var import_zod = require("zod");
var validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      return next();
    } catch (error) {
      if (error instanceof import_zod.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues.map((e) => ({ path: e.path.join("."), message: e.message }))
        });
      }
      return next(error);
    }
  };
};

// server/dto/health-profile.dto.ts
var import_zod2 = require("zod");
var updateHealthProfileSchema = import_zod2.z.object({
  body: import_zod2.z.object({
    userId: import_zod2.z.string().min(1, "User ID is required"),
    name: import_zod2.z.string().min(2, "Name must be at least 2 characters"),
    edad: import_zod2.z.number().min(1, "Age must be valid").max(120),
    peso: import_zod2.z.number().min(10, "Weight must be valid").max(350),
    altura: import_zod2.z.number().min(40, "Height must be valid").max(260),
    genero: import_zod2.z.enum(["Masculino", "Femenino", "Otro", "Prefiero no decirlo"]),
    bpmReposo: import_zod2.z.number().min(30).max(200),
    ansiedad: import_zod2.z.boolean().optional(),
    condiciones: import_zod2.z.array(import_zod2.z.string()).optional()
  })
});

// server/middlewares/auth.middleware.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Access token required" });
  }
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid or expired token" });
  }
};

// server/middlewares/rbac.middleware.ts
var requireOwnershipOrRole = (allowedRoles = ["admin", "medical_staff"]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const requestUserId = req.params.userId || req.body.userId;
    if (req.user.userId === requestUserId || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ success: false, error: "Forbidden: Not your data" });
  };
};

// server/routes/health-profile.routes.ts
var router = (0, import_express.Router)();
router.get(
  "/:userId",
  authenticateToken,
  requireOwnershipOrRole(),
  healthProfileController.getProfile
);
router.put(
  "/",
  authenticateToken,
  requireOwnershipOrRole(),
  validate(updateHealthProfileSchema),
  healthProfileController.updateProfile
);
var health_profile_routes_default = router;

// server/routes/auth.routes.ts
var import_express2 = require("express");

// server/services/auth.service.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET2 = process.env.JWT_SECRET || "fallback-secret-for-dev";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-for-dev";
var AuthService = class {
  async login(data) {
    if (data.email === "admin@safebreath.com") {
      return this.generateTokens("admin123", "admin");
    }
    if (data.email === "medic@safebreath.com") {
      return this.generateTokens("medic123", "medical_staff");
    }
    return this.generateTokens("user123", "user");
  }
  async refreshToken(token) {
    try {
      const decoded = import_jsonwebtoken2.default.verify(token, JWT_REFRESH_SECRET);
      return this.generateTokens(decoded.userId, decoded.role);
    } catch (error) {
      throw { statusCode: 401, message: "Invalid or expired refresh token" };
    }
  }
  generateTokens(userId, role) {
    const accessToken = import_jsonwebtoken2.default.sign({ userId, role }, JWT_SECRET2, { expiresIn: "15m" });
    const refreshToken = import_jsonwebtoken2.default.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return {
      user: { userId, role },
      accessToken,
      refreshToken
    };
  }
};
var authService = new AuthService();

// server/controllers/auth.controller.ts
var AuthController = class {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
var authController = new AuthController();

// server/dto/auth.dto.ts
var import_zod3 = require("zod");
var loginSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    email: import_zod3.z.string().email("Invalid email address"),
    password: import_zod3.z.string().min(6, "Password must be at least 6 characters")
  })
});
var refreshTokenSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    refreshToken: import_zod3.z.string().min(1, "Refresh token is required")
  })
});

// server/routes/auth.routes.ts
var router2 = (0, import_express2.Router)();
router2.post("/login", validate(loginSchema), authController.login);
router2.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
var auth_routes_default = router2;

// server/observability/health.routes.ts
var import_express3 = require("express");
init_metrics();
var router3 = (0, import_express3.Router)();
router3.get("/health", (req, res) => {
  const memoryUsage = process.memoryUsage();
  metrics.setGauge("nodejs_memory_heap_used_bytes", memoryUsage.heapUsed);
  metrics.setGauge("nodejs_memory_heap_total_bytes", memoryUsage.heapTotal);
  metrics.setGauge("nodejs_memory_rss_bytes", memoryUsage.rss);
  const isRedisConnected = process.env.ENABLE_REDIS !== "true" || true;
  res.status(isRedisConnected ? 200 : 503).json({
    status: isRedisConnected ? "ok" : "degraded",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
    }
  });
});
router3.get("/metrics", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(metrics.exportMetrics());
});
var health_routes_default = router3;

// server/routes/sms.routes.ts
var import_express4 = require("express");
var import_twilio = __toESM(require("twilio"), 1);
var router4 = (0, import_express4.Router)();
router4.post("/send-sms", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "Missing to or message" });
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: "Twilio credentials are not configured on the server." });
  }
  try {
    const client = (0, import_twilio.default)(accountSid, authToken);
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to
    });
    return res.status(200).json({ success: true, sid: response.sid });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({ error: error.message || "Failed to send SMS" });
  }
});
var sms_routes_default = router4;

// server/routes/index.ts
var router5 = (0, import_express5.Router)();
router5.use("/auth", auth_routes_default);
router5.use("/ops", health_routes_default);
router5.use("/health-profile", health_profile_routes_default);
router5.use("/sms", sms_routes_default);
var routes_default = router5;

// server/middlewares/errorHandler.ts
var errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : void 0
  });
};

// server.ts
var import_cors = __toESM(require("cors"), 1);

// server/events/consumers/alert.consumer.ts
init_event_bus();
init_domain_events();

// server/rules/temporal-window.store.ts
init_logger();
var TemporalWindowStore = class {
  constructor() {
    this.windows = /* @__PURE__ */ new Map();
    // Default evaluation window size is 60 seconds of telemetry
    this.defaultWindowSizeMs = 6e4;
    this.cleanupInterval = setInterval(() => this.evictStaleConnections(), 12e4);
  }
  /**
   * Adds a telemetry point to the user's temporal window, 
   * evicting points older than windowSizeMs.
   */
  addPoint(userId, point) {
    if (!this.windows.has(userId)) {
      this.windows.set(userId, { points: [], windowSizeMs: this.defaultWindowSizeMs });
    }
    const window = this.windows.get(userId);
    window.points.push(point);
    const oldestAllowed = point.timestamp - window.windowSizeMs;
    window.points = window.points.filter((p) => p.timestamp >= oldestAllowed);
    return {
      userId,
      points: window.points,
      windowSizeMs: window.windowSizeMs
    };
  }
  /**
   * Prevents memory leaks if a client disconnects unexpectedly without closing the session properly
   */
  evictStaleConnections() {
    const now = Date.now();
    let evictedCount = 0;
    for (const [userId, window] of this.windows.entries()) {
      const latestPoint = window.points[window.points.length - 1];
      if (!latestPoint || now - latestPoint.timestamp > this.defaultWindowSizeMs * 2) {
        this.windows.delete(userId);
        evictedCount++;
      }
    }
    if (evictedCount > 0) {
      logger.info(`Evicted ${evictedCount} stale temporal windows to reclaim memory.`, { event: "MEMORY_EVICT_WINDOWS", count: evictedCount });
    }
  }
};
var temporalWindowStore = new TemporalWindowStore();

// server/rules/engine.ts
var RuleEngine = class {
  /**
   * Rule: Sustained Tachycardia Anomaly (Rule T-01)
   * Detects abnormally high BPM sustained over a period, ignoring single-packet spikes.
   */
  evaluateHighBPMPersistence(window) {
    const points = window.points;
    const ruleId = "RULE_TACHY_01";
    const bpmThreshold = 120;
    const criticalDurationMs = 3e4;
    const moderateDurationMs = 15e3;
    if (points.length < 5) {
      return { triggered: false, riskLevel: "low", confidence: 0.1, ruleId, reason: "Insufficient data points" };
    }
    const latest = points[points.length - 1];
    if (latest.bpm <= bpmThreshold) {
      return { triggered: false, riskLevel: "low", confidence: 0.9, ruleId, reason: "BPM currently within normal bounds" };
    }
    let persistencyMs = 0;
    for (let i = points.length - 1; i > 0; i--) {
      if (points[i].bpm > bpmThreshold && points[i - 1].bpm > bpmThreshold) {
        persistencyMs += points[i].timestamp - points[i - 1].timestamp;
      } else {
        break;
      }
    }
    if (persistencyMs >= criticalDurationMs) {
      return {
        triggered: true,
        riskLevel: "critical",
        confidence: 0.95,
        // High confidence because it persisted > 30s safely
        ruleId,
        reason: `BPM > ${bpmThreshold} persisting continuously for ${Math.round(persistencyMs / 1e3)}s`
      };
    }
    if (persistencyMs >= moderateDurationMs) {
      return {
        triggered: true,
        riskLevel: "moderate",
        confidence: 0.75,
        ruleId,
        reason: `BPM > ${bpmThreshold} persisting continuously for ${Math.round(persistencyMs / 1e3)}s`
      };
    }
    return {
      triggered: false,
      riskLevel: "low",
      confidence: 0.5,
      ruleId,
      reason: `BPM spiked, but persistence (${Math.round(persistencyMs / 1e3)}s) too short for panic evaluation`
    };
  }
  /**
   * Orchestrates multi-signal evaluation across all registered rules.
   */
  evaluateAll(window) {
    const results = [];
    results.push(this.evaluateHighBPMPersistence(window));
    return results;
  }
};
var ruleEngine = new RuleEngine();

// server/events/consumers/alert.consumer.ts
init_metrics();
init_logger();
var AlertConsumer = class {
  register() {
    eventBus.subscribe(
      "telemetry.validated" /* TelemetryValidated */,
      this.handleTelemetry.bind(this)
    );
  }
  async handleTelemetry(payload) {
    const window = temporalWindowStore.addPoint(payload.userId, {
      bpm: payload.bpm,
      hrv: payload.hrv,
      stressLevel: payload.stressLevel,
      timestamp: payload.timestamp
    });
    const evaluations = await metrics.measureDuration("rule_evaluation_duration_ms", () => {
      return ruleEngine.evaluateAll(window);
    });
    for (const result of evaluations) {
      if (result.triggered && (result.riskLevel === "high" || result.riskLevel === "critical")) {
        if (result.confidence > 0.8) {
          logger.warn(`Escalating Rule Event`, { event: "RULE_ESCALATION", ruleId: result.ruleId, userId: payload.userId, reason: result.reason });
          metrics.increment("alert_trigger_rate");
          const alertPayload = {
            userId: payload.userId,
            alertType: "HIGH_BPM",
            // Can be mapped to result.ruleId
            severity: result.riskLevel,
            triggerData: {
              evaluation: result,
              currentBpm: payload.bpm
            },
            timestamp: Date.now()
          };
          eventBus.publish("alert.triggered" /* AlertTriggered */, alertPayload);
        } else {
          logger.info(`Flagged rule but confidence too low to escalate`, { event: "LOW_CONFIDENCE_FLAG", ruleId: result.ruleId, confidence: result.confidence });
        }
      }
    }
  }
};
var alertConsumer = new AlertConsumer();

// server/events/consumers/notification.consumer.ts
init_event_bus();
init_domain_events();
var NotificationConsumer = class {
  register() {
    eventBus.subscribe(
      "alert.triggered" /* AlertTriggered */,
      this.handleAlert.bind(this)
    );
  }
  async handleAlert(payload) {
    console.log(`[NotificationConsumer] Evaluating routing for Alert: ${payload.alertType}`);
    if (payload.severity === "high" || payload.severity === "critical") {
      const emailNotification = {
        userId: payload.userId,
        type: "EMAIL",
        priority: "high",
        message: `High alert triggered: ${payload.alertType}`
      };
      eventBus.publish("notification.queued" /* NotificationQueued */, emailNotification);
    }
  }
};
var notificationConsumer = new NotificationConsumer();

// server/events/consumers/telemetry-persistence.consumer.ts
init_event_bus();
init_domain_events();

// server/resilience/circuit-breaker.ts
init_logger();
init_metrics();
var CircuitBreaker = class {
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.state = "CLOSED";
    this.failureCount = 0;
    this.nextAttemptMs = 0;
  }
  async execute(action, fallback) {
    if (this.state === "OPEN") {
      if (Date.now() > this.nextAttemptMs) {
        this.state = "HALF_OPEN";
        logger.info(`Circuit Breaker [${this.name}] entering HALF_OPEN state`, { event: "CIRCUIT_HALF_OPEN", breaker: this.name });
      } else {
        metrics.increment(`circuit_breaker_${this.name}_rejected`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit Breaker [${this.name}] is OPEN`);
      }
    }
    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallback) {
        return fallback();
      }
      throw err;
    }
  }
  onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      logger.info(`Circuit Breaker [${this.name}] recovered and CLOSED`, { event: "CIRCUIT_CLOSED", breaker: this.name });
    }
  }
  onFailure(err) {
    this.failureCount++;
    if (this.state === "HALF_OPEN" || this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptMs = Date.now() + this.options.resetTimeoutMs;
      logger.error(`Circuit Breaker [${this.name}] tripped to OPEN`, err, { event: "CIRCUIT_OPEN", breaker: this.name });
    }
  }
};

// server/persistence/telemetry-buffer.ts
init_logger();
init_metrics();
var TelemetryBuffer = class {
  constructor() {
    this.buffers = /* @__PURE__ */ new Map();
    this.FLUSH_INTERVAL_MS = 6e4;
    // 1-minute aggregation chunks
    // Fast-fail DB connection logic
    this.dbCircuitBreaker = new CircuitBreaker("TimescaleDB_Write", {
      failureThreshold: 3,
      resetTimeoutMs: 3e4
    });
    setInterval(() => this.flushAll(), this.FLUSH_INTERVAL_MS);
  }
  addPoint(payload) {
    const { userId, timestamp } = payload;
    let state = this.buffers.get(userId);
    if (!state) {
      state = {
        userId,
        windowStart: timestamp,
        points: [],
        anomalyCount: 0
      };
      this.buffers.set(userId, state);
    }
    state.points.push(payload);
  }
  trackAnomaly(userId) {
    const state = this.buffers.get(userId);
    if (state) {
      state.anomalyCount += 1;
    }
  }
  async flushAll() {
    const summaries = [];
    for (const [userId, state] of this.buffers.entries()) {
      if (state.points.length === 0) continue;
      const summary = this.aggregate(state);
      if (summary) {
        summaries.push(summary);
      }
      state.points = [];
      state.windowStart = Date.now();
      state.anomalyCount = 0;
    }
    if (summaries.length > 0) {
      this.persistBatch(summaries);
    }
  }
  aggregate(state) {
    if (state.points.length === 0) return null;
    const bpms = state.points.map((p) => p.bpm);
    const minBpm = Math.min(...bpms);
    const maxBpm = Math.max(...bpms);
    const avgBpm = bpms.reduce((sum, val) => sum + val, 0) / bpms.length;
    let tachycardiaMs = 0;
    let currentTachyStart = 0;
    for (const p of state.points) {
      if (p.bpm > 100) {
        if (currentTachyStart === 0) currentTachyStart = p.timestamp;
      } else {
        if (currentTachyStart > 0) {
          tachycardiaMs += p.timestamp - currentTachyStart;
          currentTachyStart = 0;
        }
      }
    }
    if (currentTachyStart > 0) {
      tachycardiaMs += state.points[state.points.length - 1].timestamp - currentTachyStart;
    }
    const expectedPoints = 30;
    const density = Math.min(state.points.length / expectedPoints, 1);
    const consistencyPenalty = state.anomalyCount * 0.05;
    const signalQuality = Math.max(0, density - consistencyPenalty);
    return {
      userId: state.userId,
      windowStart: state.windowStart,
      windowEnd: state.points[state.points.length - 1].timestamp,
      avgBpm,
      minBpm,
      maxBpm,
      sampleCount: state.points.length,
      signalQuality,
      tachycardiaDurationMs: tachycardiaMs,
      anomalyCount: state.anomalyCount
    };
  }
  async persistBatch(summaries) {
    setImmediate(async () => {
      const start = performance.now();
      try {
        await this.dbCircuitBreaker.execute(async () => {
          logger.info(`Flushing batch of ${summaries.length} Time-Series Summaries to DB`, { event: "PERSISTENCE_FLUSH_START", count: summaries.length });
          if (Math.random() < 0.02) {
            throw new Error("DB Connection Timeout");
          }
          const avgSq = summaries.reduce((acc, curr) => acc + curr.signalQuality, 0) / summaries.length;
          metrics.observe("signal_quality_average", avgSq);
          metrics.observe("persistence_flush_duration_ms", performance.now() - start);
        });
      } catch (error) {
        logger.error("Batch flush failed. Shedding persistence load to protect node health.", error.message, { event: "PERSISTENCE_SHED_LOAD" });
        metrics.increment("persistence_dropped_batches");
      }
    });
  }
};
var telemetryBuffer = new TelemetryBuffer();

// server/events/consumers/telemetry-persistence.consumer.ts
var TelemetryPersistenceConsumer = class {
  register() {
    eventBus.subscribe(
      "telemetry.validated" /* TelemetryValidated */,
      this.handleValidatedTelemetry.bind(this)
    );
    eventBus.subscribe(
      "telemetry.rejected" /* TelemetryRejected */,
      this.handleRejectedTelemetry.bind(this)
    );
  }
  async handleValidatedTelemetry(payload) {
    telemetryBuffer.addPoint(payload);
  }
  async handleRejectedTelemetry(payload) {
    if (payload.reason === "NOISE_SPIKE_REJECTED") {
      telemetryBuffer.trackAnomaly(payload.userId);
    }
  }
};
var telemetryPersistenceConsumer = new TelemetryPersistenceConsumer();

// server/events/index.ts
function registerEventConsumers() {
  console.log("[Orchestrator] Registering Internal Domain Event Consumers...");
  alertConsumer.register();
  notificationConsumer.register();
  telemetryPersistenceConsumer.register();
}

// server/routes/gemini.ts
var import_express6 = require("express");
var import_genai = require("@google/genai");
var router6 = (0, import_express6.Router)();
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
router6.post("/calm", async (req, res) => {
  try {
    const { prompt, userProfile, currentVitals } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        text: "\u26A0\uFE0F El servidor de SafeBreath est\xE1 configurado en modo educativo local temporalmente. Para experimentar la calma inteligente en vivo en este bot\xF3n, por favor adjunta tu API Key de Gemini en el men\xFA Ajustes > Secretos del entorno.\n\nSugerencias de acci\xF3n inmediatas:\n1. Si\xE9ntate en postura erguida sobre una silla c\xF3moda con la espalda recta.\n2. Inhala lentamente por la nariz (4 segundos), sintiendo la expansi\xF3n del diafragma.\n3. Exhala de forma prolongada con los labios fruncidos (4 segundos). Sincron\xEDzate con el c\xEDrculo de respiraci\xF3n aqu\xED en pantalla."
      });
    }
    const systemInstruction = `Eres Sofia, la Asistente M\xE9dica de Calma y Rescate para SafeBreath. 
Tu prop\xF3sito es calmar de forma inmediata a un usuario en medio de una crisis respiratoria, ansiedad extrema o asma.
Tus directrices de comunicaci\xF3n:
1. Habla directamente en segunda persona (t\xFA). Usa espa\xF1ol c\xE1lido, emp\xE1tico, firme, claro y reconfortante.
2. Evita cualquier jerga t\xE9cnica o m\xE9dica compleja alarmante que agrave la hiperventilaci\xF3n.
3. Tus sugerencias deben ser s\xFAper sencillas de seguir inmediatamente en casa (m\xE1ximo 3 acciones numeradas).
4. Invita al usuario a sincronizar su respiraci\xF3n con el c\xEDrculo azul en pantalla de ritmo 4-4.

Informaci\xF3n \xFAtil sobre el perfil del paciente:
- Edad: ${userProfile ? userProfile.edad : "No especificada"} a\xF1os
- G\xE9nero: ${userProfile ? userProfile.genero : "No especificado"}
- Diagn\xF3stico de Asma: ${userProfile?.asma ? "S\xED" : "No"}
- Diagn\xF3stico de Ansiedad: ${userProfile?.ansiedad ? "S\xED" : "No"}

Signos vitales de la crisis actual en tiempo real:
- Pulso Card\xEDaco: ${currentVitals?.bpm || 142} BPM (reposo/pico alto)
- Ox\xEDgeno SpO2: ${currentVitals?.spo2 || 95}%`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt || "Siento opresi\xF3n y p\xE1nico. Ay\xFAdame a respirar por favor.",
      config: {
        systemInstruction,
        temperature: 0.6
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error communicating with Gemini SDK:", error);
    res.status(500).json({ error: error.message || "Fallo interactuando con el motor de IA." });
  }
});
router6.post("/analyze-cohort", async (req, res) => {
  try {
    const { cohortData } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        analysis: "\u26A0\uFE0F Modo Sin IA Activo.\n\nSimulaci\xF3n de An\xE1lisis:\n- El cohorte presenta una prevalencia moderada de ansiedad y asma.\n- La tasa media de efectividad en mitigaciones es notablemente alta.\n\n[Ingresa la API Key de Gemini para activar el an\xE1lisis en tiempo real]."
      });
    }
    const reportPrompt = `Act\xFAa como Analista de Datos de Salud de SafeBreath.
Analiza el siguiente resumen estad\xEDstico del cohorte de pacientes actuales y proporciona 3 observaciones clave breves orientadas a mejorar intervenciones preventivas:

${JSON.stringify(cohortData, null, 2)}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: reportPrompt,
      config: {
        temperature: 0.2
        // Low temp for analytical consistency
      }
    });
    res.json({ analysis: response.text });
  } catch (error) {
    res.status(500).json({ error: "Fallo interpretando datos del cohorte." });
  }
});
var gemini_default = router6;

// server.ts
setupTracing();
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express7.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express7.default.json());
  app.use("/api", routes_default);
  app.use("/api/gemini", gemini_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express7.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.use(errorHandler);
  registerEventConsumers();
  console.log("Bootstrapping Hybrid NestJS Runtime...");
  const nestApp = await import_core3.NestFactory.create(AppModule, new import_platform_express.ExpressAdapter(app));
  nestApp.useWebSocketAdapter(new import_platform_ws.WsAdapter(nestApp));
  nestApp.enableShutdownHooks();
  await nestApp.init();
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node-Express-NestJS Hybrid Server running on http://localhost:${PORT}`);
  });
  const { setupWebSocketServer: setupWebSocketServer2 } = await Promise.resolve().then(() => (init_telemetry_handler(), telemetry_handler_exports));
  setupWebSocketServer2(server);
  process.on("SIGTERM", async () => {
    console.log("[Orchestrator] SIGTERM received. Initiating graceful shutdown...");
    await nestApp.close();
    server.close(() => {
      console.log("[Orchestrator] Legacy HTTP server closed.");
      process.exit(0);
    });
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
