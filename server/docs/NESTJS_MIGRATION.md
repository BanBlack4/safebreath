# NestJS Migration Architecture: The Strangler Fig Strategy

## 1. Why Gradual Migration Matters (The Strangler Pattern)
A 'Big Bang' rewrite of a mission-critical biometric telemetry system is extremely dangerous. It introduces unpredictable regression risks, blocks feature development for months, and risks dropping emergency alerts. 

The **Strangler Fig Pattern** allows us to incrementally migrate the `Express` monolith to `NestJS`. We run both alongside each other, slowly migrating routes, ws namespaces, and consumers one by one. Once the Express app holds no more traffic, we "strangle" (remove) it.

### Express Scalability Limitations
- **Procedural Coupling:** Express encourages middleware soup and highly coupled file imports, making it hard to test in isolation.
- **Lack of Dependency Injection (DI):** Mocking databases or Redis for unit tests requires brittle tools like Jest mocks or `proxyquire`. 
- **Inconsistent Standards:** No uniform structure for controllers, services, or domain layers out of the box.

### NestJS Operational Benefits
- **First-Class TypeScript & OOP:** Strict typings, decorators, and OOP-driven architectures out of the box.
- **Dependency Injection Framework:** IoC (Inversion of Control) makes unit testing mocking trivial (just swap providers).
- **Module Isolation:** Domain boundaries are strictly enforced through `@Module` declarations.
- **Standardized WebSockets:** `@WebSocketGateway()` handles WS authentication and scaling elegantly, abstracting raw socket parsing.
- **Event Orchestration:** `@nestjs/event-emitter` or `@nestjs/microservices` native integration maps perfectly to our existing Event Bus architecture.

---

## 2. Migration Phases

### Phase 1: Shared Domain & Core Abstraction
- Pull all business logic (dto, rules, generic singletons) into a `domain` or `core` folder that BOTH Express and NestJS can import.
- Our `RuleEngine`, `TelemetryBuffer`, and `EventBus` are already mostly decoupled from HTTP/WS transports, making this easy.

### Phase 2: Hybrid Server Deployment 
- Bootstrap a basic NestJS app.
- Mount the *existing* Express app inside the NestJS initialization (`app.use(expressApp)`), or run them on separate ports under an API Gateway (like Nginx).

### Phase 3: Module-by-Module Strangling
1. **Telemetry Ingestion:** Migrate WebSocket handler to NestJS `@WebSocketGateway()`. Client traffic shifts over.
2. **Rule Engine & Events:** Wrap our deterministic classes into `@Injectable()` providers. Replace custom EventBus with `@nestjs/event-emitter`.
3. **Observability & Resilience:** Shift `MetricsRegistry` and `CircuitBreaker` into global providers/interceptors.

### Phase 4: Eradication
- Remove `server.ts` and legacy Express controllers.
- Pure NestJS application remains.

---

## 3. NestJS Module Architecture target

### `AppModule` (Root)
Orchestrates the entire application, importing feature modules.

### `CoreModule` (Global)
- **RedisModule:** Provides `@Injectable() RedisService` wrapping `ioredis`. 
- **ObservabilityModule:** Provides `Logger` and `MetricsService`. Exports global interceptors to track HTTP/WS latency.
- **ResilienceModule:** Provides parameterized DI factories for `CircuitBreaker` instances.

### `TelemetryModule`
- **TelemetryGateway:** Uses `@WebSocketGateway()` to handle auth and data ingestion.
- **TelemetryBufferService:** Aggregates time-series batch summaries.
- **TelemetryConsumer:** Subscribes to events to trigger persistence rules.

### `RuleEngineModule`
- **RuleEngineService:** Evaluates temporal windows.
- **TemporalWindowStore:** Redis-backed sliding window registry.
- Listens to internally dispatched telemetry events.

---

## 4. Provider Injection Mapping & Preservation

*How our current pure classes become NestJS Providers:*

**Current (Exported Singleton):**
\`\`\`ts
export const telemetryBuffer = new TelemetryBuffer();
\`\`\`

**Future (NestJS `@Injectable`):**
\`\`\`ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../core/redis.service';

@Injectable()
export class TelemetryBufferService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: Logger
  ) {}
  
  // Logic remains identical, but dependencies are injected!
}
\`\`\`

### Backward Compatibility
During the hybrid phase, the `@Injectable()` services can simply wrap and call our existing vanilla-TS singletons to prevent duplicating business logic until the transition is finalized.

---

## 5. Event-Driven Module Organization

 NestJS has brilliant support for Pub/Sub through its internal Event Emitter or Microservices package.

**Current Event Bus:** Custom `AppEventBus` wrapping `EventEmitter`.
**Future Integration:** `@nestjs/event-emitter`

\`\`\`ts
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AlertOrchestrator {
  constructor(private ruleEngine: RuleEngineService) {}

  @OnEvent('telemetry.validated', { async: true }) // Replaces our setImmediate!
  handleValidatedTelemetry(payload: TelemetryValidatedPayload) {
     // Trigger Rule Engine
  }
}
\`\`\`

## 6. Long-Term Maintainability Gains

1. **Testing:** Unit tests no longer require intercepting module imports. We simply provide mocked classes into the Nest `TestingModule`.
2. **Readability:** Routes, Gateway handlers, and Consumers are instantly recognizable via decorators (`@Get()`, `@SubscribeMessage()`, `@OnEvent()`).
3. **Extensibility:** Adding new ML/Analytics pipelines simply means creating a new `@Module()` that subscribes to the existing WS/Redis streams. 
4. **Resilience:** Circuit breakers and metrics can be implemented natively as `Interceptors` and `Guards`, pulling boilerplate out of the business domain entirely.
