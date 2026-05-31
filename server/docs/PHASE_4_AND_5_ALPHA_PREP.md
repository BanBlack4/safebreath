# SafeBreath AI: Phase 4 & 5 — MVP STABILIZATION & ALPHA PREP

## Crash Recovery & Resilience
*   **Corrupted Telemetry Recovery:** Data with extreme variances (e.g., a wearable reporting 250 BPM for 1 tick, then 60 BPM) is rejected by a standard deviation filter.
*   **Websocket Desync Recovery:** If the server and client states drift, the client initiates a hard HTTP REST sync to reconcile before re-establishing the socket.
*   **Safe Fallback States:** If the UI threads freeze, a watchdog worker forces a reload, immediately skipping back to the safe, calm dashboard state rather than rendering an empty white screen.

## Closed Alpha Preparation
*   **Consent Flow:** A clear, human-readable terms sequence explaining that SafeBreath is an *assistance tool*, NOT a diagnostic medical device. 
*   **Wearable Compatibility Matrix:** Explicit documentation of tested devices (e.g., Polar H10, Garmin HRM, Apple Watch capability limits via HealthKit).
*   **Feedback Pipeline:** A frictionless "Report Issue" flow that attaches compressed recent telemetry logs, BLE traces, and user comments without breaking the emotional pacing.
