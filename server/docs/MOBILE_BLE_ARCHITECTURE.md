# SafeBreath AI: React Native BLE Runtime & Device Trust Architecture

## 1. React Native Module Architecture
The mobile runtime acts as a secure edge node in the SafeBreath ecosystem. It is modularized into three core tiers to decouple the UI from high-frequency ingestion:
*   **Core UI & Orchestration:** React Native frontend (bridged to native modules) for onboarding, dashboarding, and local alert presentation.
*   **BLE Ingestion Pipeline:** Headless native tasks (or robust JS background workers) handling high-throughput BLE parsing, data smoothing, and packet sanitization.
*   **Sync & Persistence Engine:** A reliable, persistent buffering agent that forwards sanitized data to the backend via Secure WebSockets (WSS).

## 2. Wearable Abstraction Interfaces & BLE Service Layer
Wearable ecosystem fragmentation demands a unified **Wearable Abstraction Layer**.
*   **BLE Service Layer:** Built on top of native bridging (e.g., `react-native-ble-plx` or custom Swift/Kotlin modules). It manages GATT profile discovery, Bluetooth states, exponential backoff for disconnects, and MTU size negotiations.
*   **Abstraction Interface:** Defines strict contract abstractions like `IBiometricSensor`. Specific devices mapping standard `0x180D` (Heart Rate) or proprietary HRV payloads implement this interface to yield deterministic, normalized `TelemetryEvent` objects.
*   **Future Interoperability:** This abstraction allows seamless drop-in integrations for Apple HealthKit and Google Health Connect for devices that restrict direct BLE access (like Apple Watch).

## 3. Background Task Orchestration & Offline Queue
Standard React Native apps suspend immediately in the background. Our architecture relies on native background orchestration:
*   **Task Orchestration:** Leverages iOS `CoreBluetooth` background modes and Android `WorkManager` / Foreground Services to maintain the BLE connection.
*   **Offline Queue Architecture:** During disconnections, parsed telemetry is spooled to an encrypted local edge database (e.g., SQLCipher via WatermelonDB). It operates as a chronological FIFO queue, capable of buffering up to 72 hours of offline telemetry.

## 4. Secure Synchronization Workflow & Telemetry Replay Handling
When network connectivity is restored, the mobile node initiates synchronization via an aggressive batch-forwarding strategy.
*   **Telemetry Replay Handling:** To interlock cleanly with the backend's distributed replay protection, offline data is dispatched containing:
    1.  The original immutable hardware capture timestamp.
    2.  A cryptographic nonce.
    3.  A cryptographic payload signature signed by the device's hardware enclave.
*   **Backend Safe-Ingestion:** The backend rule engine identifies these as "historical syncs," effectively inserting the data into TimescaleDB without triggering *immediate* emergency orchestration pipelines incorrectly.

## 5. Device Trust Verification & Sensor Trust Evaluation
Because physiological data drives safety-critical logic, we must ensure data integrity at the origin.
*   **Device Attestation:** To prevent API abuse, customized clients, or spoofed environments, the mobile component must periodically pass **Google Play Integrity API** (Android) and **Apple App Attest** (iOS) challenges.
*   **Sensor Trust Evaluation:** Implements client-side bounding box algorithms. e.g., If a heart rate jumps from 65 BPM to 180 BPM in 2 seconds with a static accelerometer reading (no movement), the client emits the telemetry but tags it with `integrity_confidence: "low"` to warn the backend of a potential sensor glitch.

## 6. Mobile Encryption Strategy
*   **Data at Rest:** All offline buffers are fully hardware-encrypted utilizing the secure enclave / KeyStore, protecting physical device extractions.
*   **Data in Transit:** Mutual TLS (mTLS) or deep payload-level asymmetric encryption where the telemetry data is encrypted using the backend's public key prior to WebSocket transmission ensuring End-to-End Encryption (E2EE) compatibility.

## 7. Mobile Observability Strategy & OpenTelemetry Continuity
To maintain the `x-correlation-id` and distributed tracing integrity:
*   The mobile core acts as the trace root.
*   OpenTelemetry headers (`traceparent`) are attached to batched synchronization payloads. If an anomaly is reported at 2:00 PM but synced at 5:00 PM, engineers can trace the entire lifecycle seamlessly through the backend microservices.

## 8. Battery Optimization Strategy
*   **Adaptive Polling:** Drop polling frequency during extended "baseline" states, increasing frequency dynamically if stress markers are detected.
*   **Batching & Radio Sleep:** Keep the cellular / WiFi radios asleep by spooling telemetry locally, transmitting in dense chunks (e.g., every 60 seconds) rather than holding the radio continuously open for real-time WebSocket frames unless an active alert is in progress.
