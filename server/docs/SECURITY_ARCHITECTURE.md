# SafeBreath AI: Production Security Hardening & Compliance Architecture

## 1. Security Architecture Overview
The SafeBreath AI security architecture operates on a Zero-Trust, Defense-in-Depth model. It assumes that both external networks (clients) and internal networks (Kubernetes pods) are hostile and require explicit verification.

### Zero-Trust Service Boundaries
*   **Edge/Ingress:** TLS termination, initial Web Application Firewall (WAF) screening, and rate shaping.
*   **Service Mesh:** All pod-to-pod communication is encrypted using mTLS. Service identities are verified before routing.
*   **Data Tier:** Strict network policies enforce that only authorized services (e.g., Telemetry Ingestion, Orchestrator) can access the Redis state and Postgres/TimescaleDB instances.

### Distributed Trust Boundaries
*   **Client to Edge:** Ephemeral connections, authenticated via hardened JWTs and device trust tokens.
*   **Edge to Gateway:** Validated WebSocket payloads, structured sanitization.
*   **Gateway to Core Services:** Event-driven via internal decoupled message buses or mTLS-authenticated RPCs.
*   **Services to Data Stores:** Isolated DB credentials mapped to specific service accounts via vault.

## 2. Encryption Strategy
*   **Encryption In Transit:** TLS 1.3 enforced for all external connections. Istio/Linkerd mTLS enforced between all microservices.
*   **Encryption At Rest:** 
    *   TimescaleDB uses block-level encryption (LUKS/dm-crypt) managed by the cloud provider or Kubernetes CSI driver.
    *   Field-level encryption (Application-Layer Encryption) is applied to ultra-sensitive PII before it reaches the database, ensuring DB admins cannot read raw telemetry data.
*   **Key Management System (KMS):** External KMS (e.g., HashiCorp Vault, AWS KMS) orchestrates key rotation and cryptographic operations.

## 3. Secret Management Architecture
*   **Vault Integration:** Hardware-backed secret storage. Kubernetes Service Accounts authenticate to Vault via native JWT/Kubernetes Auth.
*   **Secrets Rotation:** Short-lived database credentials (auto-rotated every few hours). Vault dynamically generates Postgres credentials. No static `.env` secrets for core databases.
*   **Bootstrap Secrets:** Only connection strings to the KMS/Vault are provided to the container environment.

## 4. JWT Hardening && Device Trust Verification
*   **Hardened JWTs:** Move away from symmetric HMAC (`HS256`) to asymmetric (`RS256` / `ES256`). Public keys are distributed via JWKS endpoints.
*   **Short Lifespans & Refresh:** JWTs expire in 5–15 minutes. Refresh tokens are opaque, stateful, and tied to device fingerprints.
*   **Device Trust Affirmation:** Incoming connections must include a Device Attestation token (e.g., Apple DeviceCheck / Google Play Integrity) to prevent botnet swarms from flooding telemetry pipelines.

## 5. WebSocket Security Model & Abuse Prevention
*   **WSS Required:** Strict enforcement of Secure WebSockets.
*   **Anti-Flood & Rate Shaping:**
    *   **Connection Rate Limiting:** Prevent connection storms using Redis-backed token bucket on the Edge/Ingress layer.
    *   **Message Rate Limiting:** Enforce strict payload size limits (e.g., < 2KB per telemetry frame) and frequency limits per user connection to prevent buffer exhaustion.
*   **Replay Protection:** Re-use the existing distributed replay protection mechanism (Nonce + Timestamp validation in Redis) to discard intercepted telemetry frames.
*   **Connection Dropping:** Malformed payloads trigger immediate deterministic connection termination (no graceful error strings).

## 6. RBAC Evolution Strategy
*   **Micro-permissions:** Expand from coarse "User vs. Admin" to fine-grained scopes: `telemetry:write`, `alert:read`, `emergency:trigger`.
*   **Context-Aware Access:** RBAC rules consider the user's current context (e.g., a critical alert allows emergency contacts to read specific telemetry windows temporarily).

## 7. Audit Pipeline & Immutable Security Events
*   **Immutable Logs:** All authentication events, permission changes, and manual overrides are written to a Write-Once-Read-Many (WORM) storage layer.
*   **Decoupled Auditing:** Services emit `SecurityEvent` messages to the event bus. An isolated Audit Consumer ingests these into the immutable store.
*   **Structural Integrity:** Audit logs include the distributed OpenTelemetry trace ID (`x-correlation-id`) to track precisely which request triggered the access.

## 8. Kubernetes Security Integration
*   **Pod Security Admission (PSA):** Enforce `Restricted` profiles (no root access, required seccomp profiles, immutable root filesystems).
*   **Network Policies:** Default `Deny-All` ingress/egress. Explicit allow-lists for valid service-to-service communication paths.

## 9. Compliance-Oriented Observability
*   **Data Masking:** PII is scrubbed before being written to standard application logs.
*   **Trace Anonymization:** Trace IDs map to events, but trace payloads omit user identifiers unless required for strict incident correlation (using hashed identifiers).

## 10. Operational Incident Response Design
*   **Automated Triage:** When abnormal access patterns trigger security alerts, incident responder dashboards auto-correlate related traces via the DLQ / OpenTelemetry links.
*   **Emergency Lockdown:** Operators can toggle kill-switches via the Orchestrator to sever compromised client sessions across the distributed Redis state immediately.

---

# Explanations of Security & Compliance Tradeoffs

## Physiological Telemetry Security Risks
Physiological data is highly sensitive. The risk is not merely exposure, but unauthorized inference (e.g., inferring anxiety disorders, stress patterns). A breach of this data can lead to severe privacy violations. Furthermore, spoofed telemetry (injecting fake heart rates) could maliciously trigger emergency escalation workflows, causing panic or depleting emergency resources. 

## Distributed Authentication Challenges
In a microservices mesh running real-time WebSocket pipelines, checking authentication repeatedly adds latency and strains the identity provider. We mitigate this by validating stateless asymmetric JWTs locally on the Edge Gateway, and using distributed Redis caching to quickly check for revoked sessions without synchronous database calls.

## WebSocket Abuse Vectors
WebSockets are persistent, meaning connection exhaustion (Slowloris attacks) and message flooding are primary vectors. Because parsing large JSON payloads is computationally expensive, an attacker could CPU-starve the node. Moving payload validation to lightweight edge middleware and enforcing tight schemas (Zod/Pipes) blocks malicious payloads early.

## Auditability Requirements & Compliance Tradeoffs
HIPAA and GDPR demand that you can prove *who* accessed *what* and *when*. The tradeoff for strict immutable audit logging is storage cost and performance overhead. Operating a decoupled Audit Pipeline off the primary event bus ensures that auditing does not block the real-time processing of high-throughput telemetry data, maintaining the system's low latency.

## Operational Security Concerns & Long-Term Governance
Operational security requires that developers and DB admins have zero access to production telemetry. Implementing Field-Level Encryption ensures that even with a database dump, the underlying physiological signatures remain locked. For long-term governance, regular automated penetration testing and continuous device posture attestation will ensure that the system adapts to emerging threat vectors as BLE wearable integrations expand the attack surface.
