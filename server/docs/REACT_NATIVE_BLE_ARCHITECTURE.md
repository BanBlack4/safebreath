# SafeBreath AI: React Native BLE Integration Architecture

## 1. BLE Service Architecture & Hook System
The BLE integration leverages `react-native-ble-plx` as the core driver, wrapped in an abstract service layer to normalize diverse wearable hardware outputs into a single deterministic telemetry stream.

*   **`BleService.ts`:** A singleton manager responsible for initializing the BLE manager, tracking connection state, and orchestrating native MTU negotiations. It abstracts away characteristic UUIDs into standardized physiological types (e.g., HR, HRV).
*   **`useBLE` Hook System:** A clean React layer exposing `connect`, `disconnect`, `scan`, `isScanning`, and `telemetryQueue` to the UI components. It interfaces directly with Zustand to write normalized metrics without triggering unnecessary top-level UI renders.
*   **BLE Event Normalization:** Every tick from a wearable is intercepted, parsed according to its GATT profile specification (e.g., standard BLE Heart Rate Profile 0x180D), and normalized into a standard `{ hr, timestamp_ms, confidence }` tuple before hitting the state store.

## 2. Wearable Discovery, Pairing & Permission Management
*   **Permission Management Flow:** 
    *   *Android:* Requests `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and strictly requires `ACCESS_FINE_LOCATION` (a confusing OS requirement we mitigate via clear contextual UX explaining *why* location is needed for Bluetooth discovery). 
    *   *iOS:* Prompts for `NSBluetoothAlwaysUsageDescription`.
*   **Discovery UX:** The `startDeviceScan` method filters explicitly for authorized hardware service UUIDs to prevent polluting the UI with random TVs and laptops.
*   **Pairing Mechanism:** Devices are mapped by MAC address (Android) or UUID (iOS). Upon successful pairing, this identifier is cached in local secure storage, allowing the service to bypass manual scanning in future sessions.

## 3. Auto-Reconnect Retry Strategy & Edge Cases
*   **Exponential Backoff Retry Strategy:** If the `onDeviceDisconnected` callback fires, the singleton queues a silent background reconnection loop. It attempts reconnections at offsets: 2s, 5s, 15s, 30s, then caps at 1 minute intervals indefinitely.
*   **BLE Instability Handling:** Radio interference is inevitable. To prevent state ping-ponging (a device dropping and reconnecting 5 times in a second), the system enforces a debounce filter on connection state updates sent to the UI. 
*   **Reconnect Edge Cases:** If the OS Bluetooth stack crashes (common on Android), the `BleService` attempts a soft reset of the manager instance. For "Stale Connections" (the OS thinks it's connected, but the peripheral stopped sending data), the service implements a watchdog timer: if no HR payload is received for 10 seconds, it forces a manual disconnect and re-initiation sequence.

## 4. Signal Degradation UX & Quality Tracking
*   **Signal Quality Tracking:** Monitored via the RSSI (Received Signal Strength Indicator) and the specific hardware's "Sensor Contact Status" bit in the BLE packet.
*   **Signal Degradation UX:** If RSSI drops severely or contact status fails, a fluid, non-blocking toast appears: *"Adjusting sensor..."* or *"Signal weak, move closer."* The main telemetry waveform visually shifts from solid to dashed or slightly desaturated, indicating low confidence to the user without triggering a panic error.

## 5. Offline Buffering & State Synchronization Flow
*   **SQLite/WatermelonDB Edge Buffer:** The BLE callback stream fires at ~1Hz. Writing to SQLite at 1Hz burns battery. The `BleService` writes to a fast in-memory Zustand array. Every 60 seconds (or immediately upon a critical anomaly), this temporal buffer flushes asynchronously to WatermelonDB.
*   **Background Synchronization:** When network connectivity is present, the SQLite layer orchestrates chunked POST requests to the SafeBreath backend. During offline scenarios, the data rests safely on the encrypted edge until network restoration.

## 6. Battery-Aware BLE Usage & Optimization Strategies
*   **Battery Optimization Strategies:**
    *   Avoid active `scan()` loops in the background; rely exclusively on direct `connectToDevice()` with known identifiers.
    *   Negotiate higher connection intervals (e.g., 500ms instead of 30ms) if the wearable permits, allowing the radio to sleep between ticks.
    *   Disable unnecessary BLE characteristics (e.g., step counters) if only HR is needed during inactive periods.
*   **Wearable Battery Monitoring:** The BLE Battery Service (0x180F) is polled every 15 minutes. The UI updates the watch battery icon passively, preventing battery anxiety.

## 7. Background Limitations on iOS & Android
*   **iOS CoreBluetooth Background Execution:** iOS requires the `bluetooth-central` background mode. Even with this, iOS heavily throttles BLE activity in the background. Connections to known devices work, but active scanning is almost entirely suspended. The app relies on the peripheral waking the central via advertisements.
*   **Android Foreground Service:** Android requires an active Foreground Service with a persistent notification (e.g., "SafeBreath Monitoring Active") to prevent the OS Doze mode from killing the BLE thread after 10 minutes of screen-off time. This is a crucial UX tradeoff: a visible notification guarantees connection persistence.
