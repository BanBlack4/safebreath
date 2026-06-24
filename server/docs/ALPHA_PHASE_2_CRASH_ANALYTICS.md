# SafeBreath AI: Closed Alpha - Phase 2 Crash Analytics

## Diagnostic Architecture
To maintain absolute reliability during an intervention, we must have deep visibility into mobile runtime health. We use a combination of **Sentry** (for React Native JS crashes) and **Firebase Crashlytics** (for native iOS/Android layer panics).

### 1. Tracked Metrics
*   **App Crashes:** Fatal JS errors and Native hard crashes.
*   **Websocket Failure Tracking:** Tracking `onclose` reasons, distinguishing between network drops and server-side disconnects.
*   **BLE Disconnect Diagnostics:** Tracking the ratio of successful reconnections versus dropouts, isolating problem wearables.
*   **Memory Pressure:** Logging memory warnings sent by the OS to the JS thread to prevent OOM (Out of Memory) kills during background execution.
*   **Battery Drain Tracking:** Correlating CPU usage and BLE scan frequency with battery drop percentages over 1hr sessions.

### 2. Privacy-Safe Telemetry Logs
*   We NEVER log raw HR data linked to PII unless explicitly exporting local diagnostics.
*   Logs only contain metadata: `[BLE] Reconnect Attempt 3 Failed (Code: 133)` or `[Intervention] Triggered - False Positive Dismissed in 4.2s`.

### 3. Crash Triage Workflow
1.  **Critical Engine Failures:** BLE Service crashes, Websocket infinite loops. P0, immediate fix + OTA.
2.  **Intervention UI Freezes:** P0. If the breathing ring freezes, it causes panic.
3.  **Background Suspension Issues:** Debugging OS-level kills via remote telemetry. P1.
