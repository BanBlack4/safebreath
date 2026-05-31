# SafeBreath AI: Phase 1 — REAL API + BACKEND CONNECTION

## Authenticated WebSocket Sessions
The MVP uses secure WebSockets (WSS) authenticated via JWTs obtained during the initial Firebase login. 
*   **Session Lifecycle:** Upon connection, the client sends an `INIT` payload with the user ID and hardware UUID.
*   **Heartbeat Validation:** The client and server exchange `PING/PONG` frames every 30 seconds. If a pong is missed, the client forcefully terminates and re-enters the exponential backoff reconnect loop.

## Telemetry Batching & Transport
To preserve battery and bandwidth, high-frequency BLE telemetry (e.g., 1Hz BPM updates) is NOT streamed raw.
*   **Batching:** Telemetry points are buffered in standard arrays locally.
*   **Dispatch:** Every 5 seconds, an array of `{ bpm, hrv, timestamp }` is serialized, compressed, and dispatched over the WebSocket.
*   **Safe Degraded States:** If the connection drops mid-flight, the UI seamlessly falls back to the local SQLite/WatermelonDB edge buffer without blocking the UI.

## Offline Queue Replay
*   If disconnected, all metrics route to local storage. 
*   Upon `onopen` indicating network restoration, the `SyncEngine` reads all `synced: false` flags in the local DB.
*   It dispatches these in temporally-ordered chunks (e.g., 1 minute of data per chunk) while simultaneously continuing the real-time stream.
*   Replay payloads use original absolute UTC timestamps to prevent chronos-desync.
