# NestJS Runtime Migration Execution Strategy

## 1. Migration Execution Phases

### Phase 1: Co-existence (The Hybrid Monolith)
- **Goal:** Run both Express and NestJS within the same Node.js process.
- **Implementation:** We bootstrap a NestJS `AppModule` using `@nestjs/platform-express`, binding the existing raw `express()` app instance as the underlying HTTP provider via `ExpressAdapter`.
- **Why?** This prevents downtime. All existing HTTP routes and WebSockets remain perfectly untouched and functional, while providing a sandbox to slowly shift them over to NestJS.

### Phase 2: Observability & Resilience Providers
- **Goal:** Shift core utility singletons into NestJS Dependency Injection.
- **Implementation:** Wrap `winston`/`pino` inside a custom NestJS `LoggerService`. Implement OpenTelemetry auto-instrumentation using NestJS interceptors to preserve tracing propagation.
- **Tracing:** NestJS executes inside the same async context. We will map our existing `AsyncLocalStorage` into a global `TracingInterceptor` to enforce correlation IDs on incoming requests.

### Phase 3: The Event Emitter Transition
- **Goal:** Replace `AppEventBus` with `@nestjs/event-emitter`.
- **Implementation:** Both Express and NestJS code can fire events. We bind the NestJS event emitter to our domain models. Existing `setImmediate` patterns are replaced by the `@OnEvent({ async: true })` decorator, natively preserving event loop decoupling while gaining structured exception handling.

### Phase 4: WebSocket Gateway Migration
- **Goal:** Migrate raw `ws` Server to NestJS `@WebSocketGateway()`.
- **Implementation:** `@nestjs/platform-ws` or `socket.io`. We use an endpoint prefix (e.g. `wss://api/v2/telemetry`) to allow clients to migrate incrementally, leaving the legacy connection untouched until clients update.

---

## 2. Shared Domain Migration & Provider Injection

We avoid rewriting business logic. Classes like `RuleEngine` or `TelemetryBuffer` are pristine TypeScript. 
We simply map them to NestJS Providers by wrapping them with `@Injectable()` and adding `constructor()` injections for their dependencies (Redis, Logger). At runtime, NestJS builds the graph.

### Express Middleware to NestJS Interceptors
- **Mapping:** Express middlewares (like Zod validation or Auth extraction) map perfectly to NestJS `Pipes` and `Guards`.
- **Rollback Strategy:** If a Guard fails unexpectedly in production, we can hot-swap back to the Express middleware by commenting out the `@UseGuards()` decorator.

---

## 3. Operational Rollout & Rollback Strategy

We follow a **Canary Release** strategy:
1. Deploy Hybrid Node to 10% of Kubernetes pods.
2. Monitor `/ops/metrics` specifically for dropping `websocket_connections_active` or spikes in `circuit_breaker_rejected`.
3. If errors spike, rollback the deployment replica set. The legacy pure-Express pods will absorb the traffic immediately without persistent data loss, as real-time state is synced in Redis.

---

## 4. Risks & Operational Concerns

### WebSocket Migration Concerns
WebSockets are notoriously hard to migrate because connections are stateful. Transitioning from raw `ws` (used currently in `telemetry.handler.ts`) to NestJS gateways requires careful matching of ping/pong heartbeat semantics to avoid dropping hundreds of active connections erroneously during a cluster swap.

### Provider Lifecycle Management
When scaling horizontally, NestJS allows Providers to be `SINGLETON`, `TRANSIENT`, or `REQUEST` scoped. Making a WebSocket state machine `REQUEST` scoped will cause catastrophic memory leaks. All core domain logic must remain explicitly `SINGLETON` to match legacy behavior.

### Distributed Tracing Context Loss
Switching from raw EventEmitters to NestJS DI can result in lost `AsyncLocalStorage` context if Promises are not chained natively. We must rigorously test that Opentelemetry span IDs cross the `@OnEvent()` boundaries.

### Long-Term Maintainability Gains
- The dependency tree goes from an opaque mess of file-imports to a rigid, understandable IoC graph.
- Integration tests can replace TimescaleDB providers with in-memory arrays seamlessly without fragile `jest.mock`.
- NestJS architecture forces domain boundaries, separating the `Ingestion` layer entirely from the `Analytics` reporting layer.
