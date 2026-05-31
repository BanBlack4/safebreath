# SafeBreath AI: Phase 4 — BACKGROUND EXECUTION

## Disconnected Resilience

### Offline Telemetry Buffering
* If the websocket drops, the `SyncManager` redirects all normalized BLE data directly to WatermelonDB (SQLite).
* Data is stored with absolute device UTC timestamps. 

### Foreground/Background Transitions
* When the app moves to `background`:
  * UI renders pause entirely.
  * Websocket maintains ping/pong or enters a low-power batch mode.
* When the app returns to `foreground`:
  * Missing UI charts interpolate gracefully.
  * Any offline SQLite rows immediately begin background chunked dispatch.

### OS Caveats
* **iOS Lifecycle**: iOS may suspend the app indefinitely. The user must manually grant "Always" location if they want truly uninterrupted background BLE beacon listening, but we try to rely on state restoration where iOS wakes the app when the known BLE UUID transmits a payload.
* **Android Foreground Requirement**: Android will kill the background connection within 10 minutes without a Foreground Service. We must display a persistent notification ("SafeBreath is monitoring your vitals"). This trade-off is necessary for safety.
