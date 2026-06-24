# SafeBreath AI: Edge Physiological Intelligence Runtime Architecture

## 1. Edge Runtime Architecture Overview
The Edge Physiological Intelligence Runtime is a highly optimized, dual-engine execution environment running natively on the user's mobile device (and eventually directly on smart wearables). It provides autonomous, zero-latency safety monitoring even when completely disconnected from the global infrastructure.

*   **Dual-Engine Edge Coordinator:** Orchestrates two simultaneous processing pipelines:
    1.  **Local Deterministic Engine:** A lightweight webassembly (Wasm) or compiled native port of the backend rule engine.
    2.  **Mobile Inference Engine:** A hardware-accelerated local ML runtime (CoreML / ONNX Runtime Mobile / TensorFlow Lite).

## 2. Local Deterministic Rule Orchestration & Edge Replay Protection
*   **Authoritative Constraints:** The Local Deterministic Engine is the final authority on the device. It executes identical safety threshold schemas as the backend engine.
*   **Rule Hash Verification:** Rule sets are distributed as cryptographic artifacts. The edge engine verifies the signature and hash to ensure malicious actors cannot tamper with offline escalation bounds.
*   **Edge Replay Protection:** Anomalies triggered offline are stored in a secure local database with a deterministic nonce, hardware timestamp, and cryptographically signed alert envelope. When connectivity resumes, the *alert state itself* is synchronized to prevent the backend from blindly re-triggering the same escalation based on replayed telemetry.

## 3. Lightweight Feature Extraction & Wearable-Side Preprocessing
*   **Wearable-Side Preprocessing:** Filtering out heavy signal noise (e.g., motion artifact cancellation via accelerometer correlation) occurs directly at the wearable IC or BLE service layer to prevent transmitting useless high-frequency noise to the mobile processor.
*   **Edge Telemetry Preprocessing:** The mobile device maintains a sliding RAM buffer (e.g., last 5 minutes) of telemetry.
*   **Lightweight Feature Extraction:** Instead of complex FFTs, the edge runtime computes cheap rolling approximations (RMSDD, moving variances) utilizing SIMD instructions or DSP coprocessors where available.

## 4. Mobile Inference Lifecycle & Battery-Aware Orchestration
*   **Local Inference Runtime:** Executes the `Base_V3_Personalized` model locally (derived from the Federated Learning pipeline).
*   **Battery-Aware Inference Orchestration:**
    *   *Baseline State:* Inference runs periodically (e.g., once every 30 seconds) on down-sampled buffers.
    *   *Elevated State:* If the Deterministic Engine detects rising heart rate or sudden motion, inference is escalated to Continuous Mode (1Hz).
*   **Local Baseline Adaptation:** Short-term baseline shifts (e.g., the user is presently exercising) are handled by a lightweight state machine overriding the inference input normalization, preventing exercise from being flagged as panic.

## 5. Offline Escalation Workflow & Emergency Offline Mode
*   **Emergency Offline Mode:** If an anomaly breaches High or Critical thresholds and the device detects zero connectivity (No WiFi, No Cellular):
    *   **Local Action:** Triggers local device alarms, vibration patterns, and full-screen interventions to guide the user in breathing/grounding exercises.
    *   **Fallback Communication:** Attempts to route SOS messages via alternative physical layers (e.g., Apple Emergency SOS via Satellite, SMS fallback if data is down but cell tower connection exists).

## 6. Synchronization Reconciliation Architecture
*   **Intermittent Synchronization Support:** The edge runtime is designed for "normally disconnected" paradigms. When the pipeline reconnects, it initiates a Reconciliation Sync.
*   **Conflict Resolution:** The edge device relays both the raw telemetry buffer AND any locally generated escalation events. The cloud Deterministic Engine compares the edge's decision against the centralized rules. If the edge behaved correctly, the alert is logged chronologically without re-triggering cloud-side SMS/Push alerts.

## 7. Local Explainability Model & Operational Safety Constraints
*   **Realtime Edge Explainability:** The local ML model is constrained to generate an explainability vector (e.g., which feature drove the anomaly score: HRV vs. HR vs. Respiration Rate) that is serialized into the local alert log.
*   **Safety Constraints:** The local ML model CANNOT autonomously trigger a critical local alarm or SOS. It can only *advise* the Local Deterministic Engine, which maps the probabilities against predefined clinical safety bounds.

## 8. Edge Observability Pipeline
*   **OpenTelemetry Continuity:** Edge spans are generated locally and buffered into an offline OTLP queue. 
*   **Context Propagation:** When connectivity resumes, OTLP packets are flushed, preserving the exact hardware timestamps of when an inference occurred, how long the inference took, and when the user intervened, ensuring a continuous timeline in the global backend Jaeger instance.

---

# Explanations of Edge Intelligence Tradeoffs

## Edge Inference Tradeoffs & Mobile Compute Constraints
Running ML inference on a mobile device immediately drains battery and competes with foreground applications. While modern SoCs feature NPUs (Neural Processing Units), older or low-end Android devices rely on CPU execution. The tradeoff for zero-latency, offline anomaly detection is aggressive battery consumption. We mitigate this by using highly quantized models, but this sacrifices minor precision.

## Thermal Throttling Risks
Continuous realtime inference (e.g., processing 50Hz ECG data through a neural network) generates sustained heat. Once the SoC reaches thermal limits, the OS will aggressively throttle the CPU/NPU, causing inference latency to spike and potentially dropping BLE ingestion packets. Our battery-aware orchestration strategy strictly limits continuous inference only to verified periods of physiological elevation.

## Local ML Drift Risks
The edge device holds a localized model that adapts to the user. Without frequent synchronization to the global federated server, a user's localized model could drift wildly offline due to temporary physiological changes (e.g., being sick with a fever for a week). The edge runtime must recognize prolonged isolation and temporarily lock the adaptive baseline to prevent it from normalizing severe sustained anomalies.

## Wearable Processing Constraints
Wearable devices (smartwatches, rings) have microscopic batteries. We cannot run meaningful RNN models or Continuous Aggregates on a 20mAh ring battery. Wearable processing must be restricted strictly to basic data filtering and compression, relying on the heavier mobile edge (smartphone) processor as the primary intelligence hub.

## Offline Escalation Limitations
When completely offline, the system cannot leverage external emergency contacts, push notifications, or backend integrations. The escalation workflow is entirely localized to the user (e.g., on-screen guidance, sound). In extreme situations (user unconscious), the lack of network restricts the system from actively summoning aid unless satellite or SMS fallback is available.

## Battery Optimization Strategies
We adhere to a "wake-and-compute" model. Bluetooth LE ingestion happens in batches. The CPU wakes up, processes the 15-second buffer through the Deterministic Engine, runs a single ML inference frame, and returns to sleep. Keeping the radio and SoC active 100% of the time will kill a modern smartphone in hours.

## Operational Governance Implications
If an edge ML algorithm makes an incorrect decision while offline, auditing it relies entirely on physical device extraction or whenever the device reconnects. The company loses immediate visibility into edge performance. Engineers cannot hot-fix a broken safety rule instantly if the device is offline; updates depend on the user connecting to WiFi and pulling the latest runtime artifacts, complicating safety-critical patches.
