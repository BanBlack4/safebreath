# SafeBreath AI: ML-Augmented Physiological Intelligence Architecture

## 1. ML System Architecture Overview
The SafeBreath AI Machine Learning architecture acts as an analytical "co-pilot" to the core Deterministic Rule Engine. The system analyzes time-series physiological data, establishes personalized baselines, and detects subtle anomalies indicative of stress or panic. Crucially, the ML models are strictly advisory—they provide probability scores and contextual metadata, but **never have autonomous emergency escalation authority**.

The ML architecture consists of three core domains:
*   **Feature Engineering Pipeline:** Extracts continuous rolling features from TimescaleDB and realtime streams.
*   **Realtime Inference Services:** Scalable, Kubernetes-native ML microservices computing anomaly and stress probabilities inline.
*   **Model Training & Lifecycle Management:** Offline and asynchronous pipelines managing baseline adaptation, drift detection, and retraining.

## 2. Deterministic + ML Hybrid Orchestration Strategy
**Deterministic Rules remain the absolute, final authority.**
*   **The Orchestration Flow:** 
    1.  Telemetry is ingested, sanitized, and stored.
    2.  The ML Inference Service evaluates a rolling window of telemetry and emits a `PhysiologicalStateInference` event with a `confidence_score` and `detected_patterns`.
    3.  The Deterministic Rule Engine consumes this inference event *alongside* raw sensor data thresholds.
*   **Confidence Fusion Design:** The Deterministic Engine uses ML scores as *modifiers*, not triggers. For example, if a user's Heart Rate hits 115 BPM (normally a low-level alert), but the ML detects a characteristic "panic onset signature" with 94% confidence, the Deterministic Engine may upgrade the alert level from `low` to `moderate`. The ML cannot bypass threshold boundaries entirely.

## 3. Feature Engineering & TimescaleDB Workflows
*   **Realtime Feature Extraction:** Lightweight rolling calculations (e.g., RMSDD for HRV, rolling standard deviations) are computed via in-memory streaming window aggregations near the ingestion edge.
*   **TimescaleDB Continuous Aggregates:** Heavy historical baselining is offloaded to TimescaleDB. We utilize `Continuous Aggregates` to cheaply maintain 5-minute, hourly, and daily physiological averages and variances for every active user profile.
*   **Adaptive User Baselines:** ML models query an individual's historical T-DB baselines dynamically upon session initialization to normalize incoming raw telemetry (centering data against the user's "normal").

## 4. Inference Service Architecture
*   **Kubernetes-Native ML Microservices:** Inference runs in isolated Python-based microservices (using FastAPI + ONNX Runtime or TorchServe) deployed in the same cluster.
*   **gRPC/mTLS Communication:** Fast, secure `gRPC` over mTLS is used for inference requests from the Orchestrator to minimize latency.
*   **Edge-Origin Timestamps:** The inference pipeline strictly respects the hardware-captured `origin_timestamp`, ensuring mathematically sound time-series analysis regardless of network ingestion delays or offline sync replays.

## 5. Drift Detection & Model Lifecycle Management
*   **Continuous Drift Detection:** Shadow workers compare predicted distributions against actual physiological outcomes (or deterministic confirmations). High drift (e.g., due to a new firmware update changing sensor noise profiles) triggers alerts for data science teams.
*   **Model Retraining Workflows:** Retraining happens completely offline using anonymized, batch-extracted TimescaleDB snapshots.
*   **Safe Rollback Strategy:** Deployment of new models uses Blue-Green routing via Istio. If inference latency spikes or prediction accuracy plummets, routing is instantly reverted to the previous known-good model version.

## 6. Observability for ML Pipelines
*   **OpenTelemetry Continuity:** When the Orchestrator requests an ML prediction, the specific `x-correlation-id` is passed to the ML inference service. The inference logs, feature vectors utilized, and exact model version (`v2.4.1-hrv-baseline`) are attached to the trace context.
*   **Explainability Constraints:** The inference service is required to return an "explainability vector" (`feature_importance` weights or SHAP values) alongside the score. This data is written to the immutable audit log to document *why* a specific probability was asserted.

## 7. Operational Governance & Future Federated Learning
*   Governance strictly regulates access to training data—only de-identified, cryptographically masked sets are available for model training. 
*   Because user baselines are highly individualized, the architecture is primed for future **Federated Learning**, where localized lightweight models refine themselves on the mobile edge, sending only mathematically obscured weight-updates back to the central server, vastly enhancing global privacy.

---

# Explanations of ML Risks & Tradeoffs

## Physiological ML Risks & Training Data Governance
Training ML models on biometric data risks encoding bias (e.g., models performing poorly on specific age groups, fitness levels, or skin tones impacting optical sensors). Strict training data governance must ensure diverse, representative datasets. If a model misunderstands pathological tachycardia vs. exercise-induced tachycardia, the safety implications are severe.

## False-Positive Dangers
A high false-positive rate (detecting panic attacks or medical events when none exist) causes acute "alert fatigue." If a user or their emergency contacts are spammed with erroneous ML-triggered alerts, they will disable the system or ignore genuine emergencies. This is why ML cannot autonomously escalate to critical emergency workflows.

## Model Drift Challenges
Physiological norms change over time. A user might start a new medication (like beta-blockers, which lower maximum heart rate) or improve their cardiovascular fitness. If the adaptive baselines do not continuously slide to incorporate this drift, the model will increasingly flag normal physiological states as anomalous. 

## Realtime Inference Constraints
Performing complex recurrent neural network (RNN / LSTM) processing synchronously within a high-throughput WebSocket pipeline introduces blocking latency. Inferences must be executed asynchronously on a decoupled bus, or via highly optimized compiled runtime environments (like ONNX) with a strict latency budget (< 50ms) to prevent backpressure in the telemetry ingestion path.

## Operational ML Safety Concerns & Explainability
"Black box" ML is functionally unacceptable in safety-oriented or compliance-heavy environments (like eventual HIPAA/FDA bounds). If an emergency is misclassified, system operators and auditors must be able to interrogate the exact inputs and feature weights that led to the ML's conclusion. Explainability requirements ensure that ML decisions are structurally auditable.
