# SafeBreath AI: Contextual Physiological Cognition Architecture

## 1. Contextual Cognition Architecture Overview
The Contextual Physiological Cognition Architecture elevates SafeBreath AI from raw biometric monitoring to situational awareness. A heart rate of 130 BPM is alarming if the user is resting, but completely normal during a run. This architecture fuses raw physiological data with environmental, behavioral, and temporal context to dramatically reduce false positives and adapt safety rules dynamically.
*   **Multimodal Fusion Engine:** Ingests secondary non-biometric streams (e.g., step count, device motion class, time of day, ambient temperature).
*   **Behavioral Inference Node:** A localized edge model classifying the user's current behavioral state (e.g., Sleeping, Exercising, Driving, Sedentary).
*   **Contextual Arbitrator:** Modulates the severity of physiological anomalies based on the inferred situational context before passing them to the Deterministic Rule Engine.

## 2. Activity Recognition & Behavioral Inference Workflow
*   **Activity Recognition Orchestration:** Utilizes device OS Activity APIs (e.g., iOS Core Motion, Android Activity Recognition) alongside direct IMU (accelerometer/gyroscope) analysis from wearables.
*   **Behavioral State Inference:** Classifies temporal activity blocks (e.g., "running for 20 minutes," "transitioning to sleep"). The system creates a state machine of user activity to provide a bounding box of expected physiological responses.

## 3. Circadian Baseline Engine & Adaptive Escalation Logic
*   **Circadian Baseline Adaptation:** Physiological norms vary radically across a 24-hour cycle. The Circadian Engine models these natural fluctuations (e.g., expected heart rate dip during deep sleep, morning cortisol spike).
*   **Context-Aware Deterministic Rules:** The Deterministic Rule boundaries dynamically shift based on circadian and behavioral state. During an active "Exercise" state, the tachycardia threshold expands; during "Sleep," it constricts to detect nocturnal panic or arrhythmias.
*   **Adaptive Escalation Contextualization:** If an anomaly is detected while the user is "Driving", immediate full-screen distracting warnings are suppressed in favor of safe, non-disruptive audio boundaries and post-drive check-ins.

## 4. Environmental Telemetry Integration & Multimodal Fusion
*   **Environmental Telemetry Fusion:** Integrates contextual signals from the mobile edge, such as ambient temperature, altitude/barometric pressure changes, and geographic movement (with extreme privacy scrambling). High altitude or extreme heat naturally elevates resting heart rate; the engine compensates for this drift.
*   **Multimodal Physiological Reasoning:** The fusion pipeline cross-references biometric streams with environmental arrays. A sudden spike in respiration rate in a hot environment while moving is contextualized as exertion, whereas the same spike in a cool, dark room while sedentary triggers an acute anomaly alert.

## 5. Contextual Anomaly Arbitration & Confidence Scoring
*   **Contextual Confidence Scoring:** The ML inference engine generates an Anomaly Probability. The Contextual Arbitrator applies a multiplier. If the anomaly aligns closely with a recognized context (e.g., post-workout cooldown), the anomaly confidence is slashed. Unexplained anomalies (high HR, zero motion, sedentary state) receive a confidence multiplier.
*   **Contextual False-Positive Reduction:** This arbitration is the primary mechanism for suppressing alert fatigue, silencing alarms for expected physiological strain.

## 6. Contextual Explainability & Edge Synchronization
*   **Explainable Contextual Cognition:** The OTLP trace and local alert log explicitly record the context array: `Alert suppressed: HR=140, Context=[State:Exercise, Confidence:0.98, Motion:High]`.
*   **Edge Contextual Synchronization:** Behavioral states and contextual envelopes are delta-compressed and synchronized alongside the biometric telemetry to the TimescaleDB for longitudinal contextual analysis.

## 7. Privacy-Preserving Contextual Learning & Governance
*   **Privacy-Preserving Contextual Learning:** Location and rich environmental data are highly sensitive. Global coordinates are *never* transmitted. Only abstract classifications (e.g., `elevation_change_rate: $+10m/s`) are fed into the federated learning gradients.
*   **Operational Governance Constraints:** The introduction of contextual variables cannot override absolute "Red Line" deterministic boundaries. If HR exceeds 200 BPM, the system escalates regardless of the inferred context.

---

# Explanations of Contextual Cognition Tradeoffs

## Privacy Implications of Contextual Data
Fusing behavior, motion, environment, and potentially location context with biometrics creates a profoundly invasive data profile. An adversary could infer incredibly personal habits (when someone wakes, commutes, exercises, or has panic attacks). We strictly mitigate this by processing context entirely on the edge, aggressively discarding raw values in favor of abstract classifications (storing `state: driving`, never GPS paths), and strictly adhering to differential privacy during federated updates.

## Contextual Ambiguity Tradeoffs & Behavioral Inference Limitations
Activity recognition ML is notoriously imperfect. Sitting on a vibrating bus can falsely trigger an "Excercise/Running" state due to accelerometer noise. If the system incorrectly believes the user is exercising and expands safety thresholds, it might miss a genuine tachycardia event. We counter contextual ambiguity by requiring high-confidence corroboration (e.g., GPS speed + IMU cadence + expected HR ramp) before securely shifting the deterministic baselines.

## Environmental Signal Instability & Multimodal Fusion Complexity
Fusing non-biometric data (barometer, thermometer) introduces signal sparsity. Wearable temperature sensors usually measure skin or device temp, not true ambient temp, heavily influenced by clothing. Multimodal fusion drastically increases computational complexity on the edge device, forcing tradeoffs between battery life and contextual accuracy.

## Circadian Drift Risks
Circadian adaptation assumes a relatively stable routine. If a user travels across time zones, works night shifts, or has a radically destroyed sleep schedule due to stress, the Circadian Engine's expectations will catastrophically drift from reality, potentially triggering false anomalies because the user is awake when the model expects deep sleep. The engine requires adaptive "jet-lag/shift-work" detection heuristics to recalibrate rapidly.

## Operational Safety Implications & False-Positive Reduction
The core purpose of contextual cognition is combating Alert Fatigue. If a user is alerted every time they walk up a steep flight of stairs, they will delete the app. However, the supreme danger of contextual suppression is a "False Negative"—suppressing a real panic attack or medical emergency because the system incorrectly classified the user's pacing as a "workout." Therefore, the Contextual Arbitrator can strictly only modulate probability scores; it is mathematically barred from silencing absolute red-line safety violations defined by the Deterministic Rules.
