# Distributed Tracing & OpenTelemetry Architecture

## 1. Why Distributed Tracing Becomes Critical
In a monolith, tracking a request is as simple as following the stack trace or logging a request ID. In a distributed event-driven system (like SafeBreath), a single heartbeat telemetry packet crosses multiple async boundaries:
1. Enters via **WebSocket Gateway** (Pod A)
2. Validated and evaluated by **Rule Engine**
3. Batched into **Telemetry Buffer**
4. Triggers persistent state update in **Redis**
5. (If alert) published to **Event Bus**, processed by **Alert Consumer**
6. Sent to **TimescaleDB**

If an expected Alert *fails to fire*, or a batch *fails to save*, traditional logging leaves you with scattered, disconnected error messages. **Distributed Tracing** pieces these discrete micro-events together into a single "Trace", visualized as a waterfall flame graph (via Jaeger or Grafana Tempo).

## 2. OpenTelemetry (OTel) Instrumentation Strategy

We use OpenTelemetry as the vendor-neutral standard for instrumentation.
- **Auto-Instrumentation:** OTel automatically instruments `http`, `express`, and standard database drivers (like `pg` for TimescaleDB and `ioredis` for Redis), creating spans for every DB query and HTTP request.
- **Manual Instrumentation (Spans):** We manually wrap our continuous `Rule Engine` evaluation and `TelemetryBuffer` batch flushes in custom Spans to track performance.

## 3. Correlation ID & Trace Propagation Strategy

### The WebSocket Context Problem
Unlike HTTP, where headers (`traceparent`) easily propagate context per-request, WebSockets are continuous streams. A WebSocket connection has ONE setup phase, but thousands of distinct telemetry events flow over it. 
- *Strategy:* The client MUST inject a `correlationId` into the JSON payload of critical telemetry packets (or explicitly into an Alert event). 
- If none is provided, the Ingestion Service generates a new `spanId` and `traceId` for that specific logical event window, persisting it through the Event Bus.

### Async Trace Continuity (AsyncLocalStorage)
Node.js relies on an event loop. When a telemetry packet triggers `eventBus.publish()`, it enters `setImmediate`, jumping to a new execution stack. The trace context is easily lost.
- *Strategy:* We utilize Node's `async_hooks` via `AsyncLocalStorage` or OpenTelemetry's native `ContextManager`. This allows us to implicitly pass the `traceId` across `setImmediate`, `Promise.all`, and `setTimeout` boundaries without bloating every function signature with a `correlationId` parameter.

### Event Bus Trace Linking
When an event hits the internal Event Bus (or future Kafka topic):
- The `traceparent` context is serialized into the Event Payload metadata.
- Consumers extract the metadata and call `tracer.startSpan('AlertConsumer', { links: [...] })` to securely link the distributed chunks of the execution trace.

### DLQ Trace Preservation
When a message fails and lands in the Dead Letter Queue:
- We preserve the exact `traceId`. When diagnosing the DLQ, an engineer can paste the `traceId` into Grafana Tempo to see the exact chain of events, DB latency, and rule evaluations that led to the fatal error.

## 4. Trace Sampling Tradeoffs

Generating a trace for *every single heartbeat* (5Hz * active users) will destroy network bandwidth, crash the OTel Collector, and cost millions in observability storage.
- **Head-Based Sampling:** We sample basic telemetry ingress at **1% or 0.1%**.
- **Tail-Based Sampling:** We configure the OTel Collector to buffer traces and *always keep* traces that contain an `ERROR` span, an Alert generation, or high latency (>500ms). This requires a centralized Collector architecture.

## 5. Operational Troubleshooting Workflow (The Life of a Trace)

1. **User Reports:** "My App didn't alert my emergency contact during a severe panic episode."
2. **Support Agent:** Finds the user's `userId` and the approximate timestamp.
3. **Engineer:** Searches Jaeger/Tempo for `userId` and finds the trace of the anomaly.
4. **Trace Waterfall Visualizes:**
   - *Span 1:* WS Gateway received the packet (Latency: 2ms).
   - *Span 2:* Temporal Store fetched history from Redis (Latency: 45ms).
   - *Span 3:* Rule Engine evaluated state (Result: TRIGGERED).
   - *Span 4:* Alert Consumer tried to send SMS via Twilio.
   - *Span 5 (ERROR):* Twilio API returned 429 Too Many Requests.
5. **Resolution:** The engineer immediately knows it wasn't a DB failure or algorithmic bug, but a downstream rate limit. The trace proves the causality instantly.
