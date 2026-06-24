# SafeBreath AI: Physiological Mesh Coordination Architecture

## 1. Physiological Mesh Topology
The Physiological Mesh operates as a localized, decentralized sensor network enveloping the user. It treats multiple independent hardware devices (e.g., a smartwatch, a smart ring, a chest strap, and a smartphone) as a unified, coordinated sensing organism.
*   **Mesh Arbitrator (Tier 1):** The smartphone acts as the central local arbitrator, managing the heterogeneous device graph.
*   **Primary/Secondary Sensors (Tier 0):** Wearables dynamically negotiate roles based on signal quality and battery life. If the primary sensor (e.g., smartwatch) loses optical contact, the secondary sensor (e.g., smart ring) seamlessly promotes its telemetry stream.
*   **Low-Bandwidth Mesh Communication:** Nodes communicate via a highly optimized multiplexed BLE/Thread mesh, keeping radio power to an absolute minimum while maintaining node awareness.

## 2. Sensor Fusion Architecture & Distributed Edge Coordination
*   **Sensor Fusion Coordination:** Telemetry from disparate vendors is normalized into standard `TelemetryEvent` structures. The Fusion Engine mathematically aligns time-series signals (e.g., merging wrist-based PPG with ring-based PPG) to eliminate dropout noise.
*   **Distributed Edge Coordination Workflow:** Devices do not blindly broadcast data. The Mesh Arbitrator assigns sensing windows. If the user is asleep, the Arbitrator commands the smartwatch to sleep its high-power sensors and relies entirely on the ultra-low-power smart ring.
*   **Mesh Telemetry Compression:** Telemetry streams are interleaved. Instead of transmitting duplicate timestamps, the mesh uses synchronized epoch offsets and Delta-Delta encoding to achieve microscopic payload sizes.

## 3. Consensus-Based Anomaly Validation & Cross-Device Synchronization 
*   **Cross-Device Anomaly Validation:** A single device detecting an anomaly triggers a "Provisional Alert." Before full escalation, the Arbitrator polls the mesh: *The smartwatch detected a severe HR spike. Does the smart ring confirm? Does the smartphone accelerometer confirm lack of motion?*
*   **Edge Arbitration Engine & Edge Consensus:** The Arbitrator weights the votes using an Adaptive Confidence Scoring matrix. If multi-device consensus is reached, the anomaly is upgraded from Provisional to Confirmed.
*   **Cross-Device Synchronization Strategy:** If the Arbitrator (phone) is disconnected, remaining mesh nodes elect a temporary sub-arbitrator to maintain local consensus logs until reconnection.

## 4. Resilient Failover Sensing & Wearable Failover Orchestration
*   **Wearable Failover Orchestration:** If a critical node drops offline (e.g., smartwatch battery dies), the Arbitrator instantly re-routes sensing duties to remaining nodes.
*   **Graceful Degradation:** The confidence threshold schemas automatically expand. An anomaly detected by a single remaining sensor requires a higher magnitude of severity to trigger an escalation than an anomaly confirmed by three fused sensors.

## 5. Distributed Confidence Aggregation & Distributed Physiological Baselines
*   **Adaptive Confidence Scoring:** Each sensor carries a dynamic trust weight. A chest strap holding steady ECG data is weighted higher than a loose smartwatch PPG sensor. Weights adjust in real-time based on signal-to-noise ratio (SNR) heuristics.
*   **Distributed Physiological Baselines:** The Federated Learning baseline is distributed across the mesh. Even if a user swaps from a watch to a ring, the mesh continues evaluating against the unified physiological identity.

## 6. Mesh Replay Protection & Operational Governance
*   **Mesh Replay Protection:** The multi-device consensus logs are cryptographically sealed. When the mesh resyncs to the cloud, the backend ingests a single, unified "Mesh Fusion Event" signed by the Arbitrator, preventing duplicated telemetry replays from flooding the TimescaleDB.
*   **Operational Governance Constraints:** Adding a new class of hardware to the mesh requires a certified "Sensor Trust Profile" pushed securely from the cloud, ensuring hostile or low-quality sensors cannot inject garbage data into the consensus loop.

## 7. Mesh Observability Architecture
*   **Trace Federation:** OTLP spans are tagged with `mesh_node_id`. A single backend trace can show: `Ring Detected Anomaly` -> `Arbitrator Requested Consensus` -> `Watch Confirmed Anomaly` -> `Arbitrator Executed Haptics`.

---

# Explanations of Mesh Coordination Tradeoffs

## Sensor Fusion Tradeoffs & Distributed Anomaly Ambiguity
Fusing data from heterogeneous sources introduces immense mathematical complexity. What happens when the smart ring shows a resting HR of 60, but the watch shows 180? This distributed ambiguity forces the arbitration engine to fall back to deterministic safety rules or rely on secondary indicators (like accelerometer stability). The tradeoff of a mesh is that conflicting data requires heavier local CPU processing to resolve, temporarily sacrificing battery.

## Wearable Clock Drift Risks & Mesh Synchronization Complexity
In a mesh, exact chronological alignment is critical. A physiological spike happening at exactly 12:04:01.000 across three devices proves a real event. However, wearable hardware clocks drift rapidly. Reconstructing multi-device sensor fusion when clock offsets vary by hundreds of milliseconds requires constant, complex Network Time Protocol (NTP)-style synchronization pulses over BLE, which drains power and complicates edge synchronization buffers.

## Battery Coordination Tradeoffs
Keeping a mesh actively talking to each other prevents devices from entering deep sleep states. To maintain consensus architecture, devices must occasionally wake up to broadcast "I am alive and sensing." Optimizing this heartbeat to preserve battery while ensuring the mesh hasn't fragmented is the primary engineering constraint of wearable mesh networks.

## Heterogeneous Hardware Instability
Supporting devices across the Apple, Garmin, Oura, and generic BLE ecosystems means handling fundamentally different sensor polling rates, smoothing algorithms, and payload structures. Normalizing a 1Hz Apple Watch feed with a 10Hz raw Polar chest strap feed in real-time requires significant digital signal processing on the edge arbitrator, risking thermal throttling on the mobile device.

## Mesh Security Boundaries & Operational Safety Implications
The mesh significantly widens the attack surface. An adversary compromising a lower-security peripheral (like a cheap BLE heart rate monitor) could theoretically inject poisoned data into the mesh to intentionally trigger false positives or suppress real alarms. Zero-trust must extend to the hardware layer—every node must cryptographically attest its identity before its vote is counted in the consensus engine. Operational safety dictates that the mesh defaults to the most conservative (safest) interpretation during ambiguity.
