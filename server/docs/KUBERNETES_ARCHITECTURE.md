# Cloud-Native Kubernetes Architecture for SafeBreath

## 1. Kubernetes Deployment Topology

The SafeBreath backend is designed for high-availability, horizontal scalability, and fault-tolerant operations. The architecture splits workloads to isolate stateful data stores from stateless stream-processing components.

### 1.1 Stateless Workloads (The Compute Layer)
- **SafeBreath Web Node (Deployment):** Runs the Express/NestJS application. Handles HTTP requests (Authentication, Profiles) and WebSocket ingress (Telemetry Ingestion).
  - *Scaling:* Scales horizontally via Horizontal Pod Autoscaler (HPA) based on CPU, Memory, and custom metrics (Active WebSocket Connections).
- **SafeBreath Background Workers (Future):** Dedicated pods for processing heavyweight DLQ retriggers or eventual ML model inference, isolated from the critical realtime HTTP/WS path.

### 1.2 Stateful Workloads (The Data Layer)
- **Redis Cluster / Sentinel:** 
  - *Role:* Coordinates distributed WebSocket sessions, maintains sliding temporal windows, prevents cross-node replay attacks, and buffers Pub/Sub events.
  - *Topology:* Deployed via StatefulSet (or managed service like ElastiCache/Memorystore). Requires strict highly-available persistence (AOF/RDB) to prevent temporary amnesia which could break the Rule Engine's continuous temporal tracking.
- **TimescaleDB (PostgreSQL):**
  - *Role:* Persistent storage for Time-Series telemetry summaries and Health Profile RBAC.
  - *Topology:* High-Availability StatefulSet with Primary/Replica replication (or managed service like Cloud SQL/RDS). Replicas can be used for async read queries (Analytics Dashboard) while the primary handles fast batch-inserts from the `TelemetryBuffer`.

---

## 2. Ingress and WebSocket Routing Strategy

### The WebSocket Orchestration Challenge in Kubernetes
Kubernetes balances traffic perfectly for HTTP via Round-Robin. However, WebSockets are long-lived TCP connections. 
If an Ingress Controller (like Nginx) routes a WebSocket connection to Pod A, that connection persists on Pod A indefinitely. 
- *Problem:* Over time, if Pod A restarts, its connections scatter. If traffic spikes, new Pods may not get an even distribution of the long-lived WS connections.
- *Solution:* We configure the Ingress layer to allow Session Affinity (Sticky Sessions) but rely primarily on our **Distributed Redis Session Store** to orchestrate intra-pod communication.

### Ingress Configuration
- **Load Balancer:** Standard cloud L4/L7 LB pointing to an NGINX Ingress Controller.
- **NGINX Annotations:** Ensure `proxy-read-timeout` and `proxy-send-timeout` are exceptionally high (e.g., 3600s) to prevent idle WebSockets from being dropped aggressively.
- **Connection Draining:** During Rolling Updates, proper `preStop` hooks in the Pod must be used to send a "Graceful Disconnect" frame to WS clients, commanding them to seamlessly reconnect (which will land them on a new healthy Pod).

---

## 3. Resilience and Operational Reliability

### Probes and Health Checks
Kubernetes lifecycle management heavily relies on our existing `/ops/health` endpoint:
- **Liveness Probe:** Checks if the Node.js event loop is completely deadlocked. If it fails, K8s restarts the Pod.
- **Readiness Probe:** Checks if the Pod has successfully connected to Redis and TimescaleDB. If the DB circuit breaker is open, the Pod temporarily fails Readiness and K8s stops routing new HTTP/WS traffic to it, allowing it to recover.

### Rolling Upgrades Without Downtime
1. K8s spins up a new ReplicaSet.
2. Readiness probes ensure the new Pods are fully connected to the DB/Redis and warmed up before K8s adds them to the Service.
3. Once ready, K8s sends a `SIGTERM` to the old Pods.
4. Old Pods intercept `SIGTERM`, stop accepting new connections, gracefully close existing WebSockets (pushing clients to reconnect to the new Pods), and wait for the `TelemetryBuffer` to flush its final batch to TimescaleDB before exiting.

---

## 4. Autoscaling Considerations

### Horizontal Pod Autoscaler (HPA)
Scaling purely on CPU is insufficient for Node.js WebSocket servers, which are heavily I/O bound and event-driven. We use **Custom Metrics** via Prometheus Adapter:
- Scale up if CPU > 70% OR
- Scale up if Memory > 75% (Node.js Garbage Collection struggles near limits) OR
- Scale up if `websocket_connections_active` > 5000 per Pod.

---

## 5. Centralized Observability & Secrets Management

- **Logging:** All Pods output logs in JSON format via `stdout` (handled by our `Logger` abstraction). Promtail/FluentBit daemonsets scrape these and ship them to Grafana Loki or Datadog.
- **Metrics:** Prometheus scrapes the `/ops/metrics` endpoint of every Pod. Grafana aggregates this data to visualize cluster-wide telemetry, dropped packets, and circuit breaker states.
- **Secrets:** JWT keys, TimescaleDB credentials, and Redis URIs are injected into Pods as Environment Variables securely via Kubernetes Secrets (potentially backed by HashiCorp Vault or AWS Secrets Manager).

---

## 6. Strategic Cost & Failover Tradeoffs

### Production Failover Design
- Our system handles telemetry degradation gracefully: If TimescaleDB goes down, the `CircuitBreaker` drops analytical inserts to protect the Node.js realtime event loop. Emergency alerts continue functioning because they rely entirely on the distributed Redis memory.
- If Redis fails, the system detects it, fails strict readiness checks to prevent chaotic rule evaluation, and falls back to a limited stateless mode or fully pauses until the Redis cluster re-elects a leader.

### Infrastructure Cost Tradeoffs
Storing high-frequency continuous telemetry in managed databases is extremely expensive. 
Our strategy of **Time-Series Batching and Aggregation** inside the Node.js layer reduces the write-volume to TimescaleDB by ~98%, significantly driving down primary infrastructure costs while preserving the analytical fidelity required for future Machine Learning pipelines.
