# SafeBreath AI: Federated Edge Intelligence & Privacy-Preserving Architecture

## 1. Federated ML Architecture Overview
SafeBreath AI's Federated Learning (FL) architecture shifts the paradigm from centralized data aggregation to decentralized model training. Instead of continuously streaming sensitive raw physiological data to the cloud for model refinement, the global model is sent to the mobile edge. The edge device learns from raw local data, computes localized model updates (gradients), and sends only these mathematical updates back to the central server.
*   **Global Aggregation Server (Backend):** A Kubernetes-based service responsible for distributing the base model, securely aggregating received model gradients, and updating the global intelligence.
*   **Edge Intelligence Node (Mobile App):** Contains a localized inference engine (e.g., CoreML, TensorFlow Lite) and an edge training orchestrator.
*   **Secure Aggregator Protocol (SecAgg):** Cryptographic protocol ensuring the server cannot reverse-engineer an individual's physiological state from their gradient updates.

## 2. Personalized Baseline Adaptation & Edge Training Lifecycle
*   **Local Personalization:** The global model provides a generalized capability for anomaly detection. Once downloaded to the device, a secondary localized layer (transfer learning) fine-tunes itself specifically to the user's highly individual physiological baseline using data strictly kept on-device.
*   **Edge Training Lifecycle:** 
    1.  The device pulls the latest global model `Base_V3`.
    2.  During low-power, idle/charging states (typically overnight), the device runs localized training epochs against recently buffered telemetry.
    3.  A differential weight update tensor (gradient) is generated.
    4.  The update is synchronized securely to the backend.

## 3. Secure Aggregation Workflow & Differential Privacy
*   **Privacy-Preserving Gradient Synchronization:** To prevent malicious inference attacks (where the server reconstructs raw data from gradients), **Differential Privacy (DP)** adds statistical noise to the gradients on the device before transmission.
*   **Secure Aggregation Protocol:** Utilizing Secure Multiparty Computation (SMPC), gradients from thousands of edge devices are mathematically masked. The central server can only decrypt the *sum* of the gradients across a large cohort, rendering individual gradient inspection computationally impossible.

## 4. Decentralized Model Update Orchestration 
*   **Offline Federated Synchronization:** Edge devices operate asynchronously. If unconnected, offline gradients are buffered securely within the local SQLCipher enclave.
*   **Intermittent Sync Buffering:** Upon re-connection, orchestrators negotiate a synchronization window. Stale updates (calculated on models older than N versions) are deterministically discarded by the server to prevent temporal poisoning.

## 5. Secure Enclave & Edge Inference Optimization
*   **Secure Enclave Integration:** Sensitive keys used for Secure Aggregation operations are protected by the hardware-backed Secure Enclave (Apple) or KeyStore (Android).
*   **Optimization Strategies:** ML Models are quantized (e.g., INT8 precision) and pruned before distribution to fit within the strict memory and computational bounds of mobile architectures. Inference runs via hardware-accelerated neural engines (NPU).

## 6. Edge Observability & Traceability Strategy
*   **Trace Continuity:** While individual data is hidden, the *mechanics* of training are fully observed. OpenTelemetry spans track the start/stop of local training epochs, battery consumption metrics, and the successful application of new model weights.
*   **Performance Telemetry:** Anonymized logs capture inference latency (`p99 < 15ms`) to ensure edge intelligence does not disrupt the main React Native UI or BLE ingestion threads.

## 7. Model Distribution, Rollback, and Validation
*   **Distribution Strategy:** Models are deployed as immutable, versioned artifacts (e.g., `model-v4.1.onnx`) hosted behind a CDN and pulled securely by the edge nodes.
*   **Shadow Validation:** After receiving aggregated updates from the network, the central Orchestrator evaluates the new Global Model candidate against a centralized, highly-curated dummy dataset to ensure no catastrophic forgetting or regression occurred.
*   **Rollback Mechanism:** If an edge device detects an unacceptable spike in local inference errors or a crash, it automatically falls back to the previous model version and flags the central telemetry system.

## 8. Governance & Operational Deployment Strategy
*   **Auditability vs. Privacy:** To preserve explainability, the Deterministic Rule Engine is evaluated in parallel with ML decisions. The system logs *which* model version generated a prediction, even if the training data remains securely decentralized.
*   **Deployment Staggering:** Federated models are released progressively—initially deployed in shadow-mode for edge inference logging, then graduated to local active inference, before global synchronization is enabled.

---

# Explanations of Federated Intelligence Tradeoffs

## Federated Learning Tradeoffs & Edge Computational Limitations
Moving training to the edge preserves privacy at the cost of device resources. Mobile devices have strict thermal, battery, and memory constraints. Training must be heavily rate-limited and restricted to ideal conditions (plugged in, on WiFi, screen off) to prevent battery drain or UI stuttering, meaning global model convergence takes significantly longer than centralized batch-training.

## Physiological Privacy Risks & Secure Aggregation Challenges
Standard federated gradients can ironically leak information. Through model inversion attacks, a sophisticated adversary observing raw gradient streams could determine if a specific physiological trait (e.g., an abnormal arrhythmia signature) was present in the local training data. Differential Privacy mitigates this by adding mathematical noise, and Secure Aggregation mathematically blinds the server. The tradeoff is extreme complexity in managing cryptographic keys across millions of constantly disconnecting mobile clients.

## Adversarial Model Poisoning Risks
In a decentralized system, the server blindly trusts the edge updates. A coordinated swarm of compromised edge devices or malicious actors could begin feeding poisoned gradients designed to make the global model ignore specific distress signals or inject false-positive bias. Extensive anomaly detection on inbound gradients and curated validation sets are required to discard mathematically anomalous updates before they pollute the global model.

## Personalized Baseline Adaptation & Governance Implications
Physiological features are profoundly unique. A purely global model will always underperform for outliers. Allowing individual models to adapt locally means different users will eventually be running highly diverged logic. From a compliance and governance perspective, this complicates liability—if a decentralized, personalized model diverges significantly and fails to detect a distress event, auditing the exact failure state is challenging because the specific model state only exists on the user's physical device. Therefore, deterministic safety limits must mathematically box-in ML behavioral boundaries.
