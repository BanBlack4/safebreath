# SafeBreath AI: Closed Alpha - Phase 3 Wearable Compatibility Matrix

## Device Constraints & Architecture

SafeBreath operates as a central BLE node, but the wearable ecosystem is fragmented. 

### Supported Device Table

| Device Family | Connection Type | Background Reliability | Latency | Viability for Panic Intervention |
| :--- | :--- | :--- | :--- | :--- |
| **Polar (H10, Verity)** | Direct BLE (`0x180D`) | Excellent | < 1s | **Tier 1 (Recommended)** |
| **Garmin (HRM, Watches)** | Direct BLE (Broadcast mode) | Very Good | < 1s | **Tier 1** |
| **Apple Watch** | HealthKit (Background Sync) | Poor (Batched) | Minutes | **Tier 3 (Not suitable for real-time)** |
| **Samsung Galaxy Watch** | Samsung Health / local proxy | Moderate | Variable | **Tier 2** |
| **Fitbit** | Web API / Proprietary | Very Poor | Hours | **Not Supported** |
| **Generic BLE Bands (Xiaomi, etc.)** | Direct BLE | Good | ~2s | **Tier 2** |

### Proprietary API Constraints
*   **Apple Watch Restriction:** iOS sandbox prevents direct, continuous realtime streaming of raw HR from Apple Watch to a 3rd-party app without aggressive background battery burn. HealthKit only syncs retrospectively in batches. We cannot trigger a 5-second panic intervention via HealthKit. 
*   **Solution:** Alpha focuses exclusively on users with direct-BLE broadcast wearables (Polar, Garmin transmitting over standard GATT).

### Background Limitations
*   **iOS BLE:** Allows background listening for known UUIDs, but drops priority if battery is low.
*   **Android BLE:** Requires a persistent Foreground Service notification. Some OEMs (Samsung, Xiaomi) aggressively kill background services (Don't Kill My App issue). We must implement `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` for testers.
