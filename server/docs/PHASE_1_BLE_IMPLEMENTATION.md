# SafeBreath AI: Phase 1 — REAL BLE IMPLEMENTATION

## BLE Service Layer Architecture
The BLE integration uses `react-native-ble-plx` to provide a robust, cross-platform interface to the mobile device's Bluetooth radio.

### Wearable Discovery & Pairing Flow
1. **Scanning**: `BleManager.startDeviceScan` is invoked with specific Service UUIDs (e.g., Heart Rate `0x180D`) to filter out noise (TVs, laptops).
2. **Pairing**: Upon user selection, the device MAC/UUID is saved securely. Future connections use `connectToDevice()` directly, bypassing the battery-heavy scanning phase.
3. **Connection State**: Tracks `Connecting`, `Connected`, `DiscoveringServices`, `Monitoring`, and `Disconnected`.

### Reconnect Orchestration & Edge Cases
* **Disconnect Bursts**: Radios fail. We implement a debounce on UI disconnect alerts to prevent state ping-ponging.
* **Reconnection Strategy**: Exponential backoff. 2s, 5s, 15s, 60s. After 5 minutes, it shifts to opportunistic background polling.
* **Stale Packets / Zombie Connections**: If no HR packet is received for 10 seconds despite the OS reporting "Connected", the service forces an explicit disconnect and restart.
* **Duplicate Packets**: The `PacketNormalizer` drops payloads with identical timestamps or sequence IDs.

### Signal Quality Tracking
* Tracks moving average of RSSI. If RSSI drops below -85dBm consistently, we downgrade confidence and visually hint the user.

### Background Constraints
* **iOS**: `bluetooth-central` background mode restricts active scanning. Devices must already be paired. iOS wakes the app briefly when a paired device advertises.
* **Android**: Requires a Foreground Service to maintain reliable connection and prevent deep Doze mode freezing the BLE worker thread.
