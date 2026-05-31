# SafeBreath AI: Offline-First Synchronization Architecture

## 1. Local Persistence Strategy & Architecture

SafeBreath is an offline-first application. A panic attack or medical anomaly does not wait for a stable 5G connection. The app must provide 100% of its grounding, monitoring, and intervention capabilities while completely disconnected from the cloud.

*   **Dual-Layer Data Architecture:**
    1.  **Zustand (In-Memory/Volatile):** Handles sub-second, real-time UI state (e.g., the current rendering frame of the breathing sphere, the live 60-second HR array for the waveform).
    2.  **WatermelonDB/SQLite (Persistent Edge Node):** The source of truth on the device. Reactively stores all raw telemetry, session logs, and intervention events. It acts as an immutable local ledger.

*   **Local Telemetry Buffering:**
    *   BLE data continuously streams into the Zustand live buffer.
    *   Every 30-60 seconds (or immediately upon a triggered anomaly), a background worker flushes this UI buffer into WatermelonDB.
    *   This batching strategy drastically reduces costly I/O disk writes, preserving battery life.

## 2. Synchronization & Websocket Reconnection Logic

The sync engine operates silently in the background, treating the cloud strictly as a backup and advanced ML processor, never as the primary operational requirement.

*   **Websocket Reconnection Logic:**
    *   The app maintains a persistent WebSocket connection. If the socket drops (`onclose`), the app enters an exponential backoff reconnect loop (2s, 5s, 15s, 60s max).
    *   During disconnection, the UI does NOT block. It simply shifts seamlessly to relying purely on local edge data.
*   **Sync Queues & Batched Uploads:**
    *   When the OS broadcasts a "network restored" event, the `SyncManager` queries WatermelonDB for all records marked `synced: false`.
    *   These records are compressed and dispatched in chronologically ordered, chunked REST/WebSocket payloads.
    *   *Battery Efficiency:* Syncing is paused if the device battery drops below 15% and is not charging, unless an emergency SOS event is queued.

## 3. Offline Intervention Continuity

*   **Deterministic Safety:** The rules engine that triggers the "Calm Intervention" view runs entirely locally on the mobile device. It does not wait for a cloud round-trip to decide if a heart rate spike is anomalous. 
*   **Offline SOS Fallback:** If an intervention escalates to a required SOS dispatch and the device has no internet but *has* a cellular (voice/SMS) connection, the app will fall back from cloud-based API dispatch to OS-native predefined emergency SMS protocols (where permitted by OS sandboxing, or prompt the user with a pre-filled SMS modal).

## 4. Sync Reconciliation UX & Offline Indicators

*   **Offline Indicators:**
    *   A panicked user should not see a scary red "NO INTERNET CONNECTION" banner. This induces secondary anxiety.
    *   Instead, a very subtle, pill-shaped chip appears near the top of the UI: "Offline • Monitoring Locally". It communicates that the app is still protecting them.
*   **Stale Data Communication:**
    *   In the "Journey" (history) tab, if the user scrolls back to yesterday and the cloud sync hasn't completed fetching that data, the UI displays a soft skeleton loader or states: "Waiting for connection to load past journeys." No crash screens.
*   **Sync Reconciliation UX:**
    *   When a background sync completes successfully, there are no intrusive popups or screen-blocking modals. The "Offline" chip simply dissolves. If the user is on the history screen, new data fades in smoothly.

## 5. Conflict Resolution Flow

*   **Timestamp-Based Truth (LWW):** Telemetry is strictly append-only time-series data. We use Last-Write-Wins based on absolute UTC timestamps generated at the exact moment the BLE packet was received on the phone, never the cloud-received time.
*   **Local Wins:** For user settings or emergency contact updates made while offline, the local device is considered the temporary authority. If a conflict occurs with server-side changes made from another device, the system prompts the user upon reconnection: "We found newer settings. Keep this device's settings or update from the cloud?" to ensure they know exactly who their emergency contacts currently are.
