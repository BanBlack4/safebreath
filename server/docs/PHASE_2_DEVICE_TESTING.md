# SafeBreath AI: Phase 2 — REAL DEVICE TESTING INFRASTRUCTURE

## Developer Telemetry Console
To validate the MVP on physical hardware, we include an obfuscated developer overlay (triggered by holding the app title for 5 seconds).

### Features:
*   **BLE Packet Inspector:** Displays a scrolling terminal of raw characteristic payloads (Hex/Decoded) to debug wearable anomalies.
*   **Websocket Latency:** Tracks round-trip time (RTT) in milliseconds. Highlights in amber if >300ms, red if >1000ms.
*   **Memory Pressure:** Basic heuristic readout tracking telemetry array growth to prevent memory leaks in the background worker.

## Anomaly Simulation Tools
Safety is paramount, meaning we cannot ask users to physically induce panic attacks.
*   **Chaos Testing Profiles:** The dev console provides triggers for:
    *   *Simulate HR Spike (>120 BPM)*
    *   *Simulate Signal Drop (RSSI < -95)*
    *   *Simulate Websocket Disconnect (Force onclose)*
*   **Background Execution Testing:** Verification workflows confirming the Android Foreground Service keeps the BLE thread alive for >12 hours while the screen is off.
