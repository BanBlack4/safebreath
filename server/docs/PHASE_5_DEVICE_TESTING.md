# SafeBreath AI: Phase 5 — REAL DEVICE TESTING STRATEGY

## Testing Checklist

### 1. BLE Stress & Chaos Testing
* **The Microwave Test**: Walk far away, stand behind a microwave, induce severe packet loss. Does the UI handle degraded RSSI gracefully?
* **Battery Pull Test**: Yank the battery from the wearable. Does the app correctly identify a disconnected state within 10 seconds?
* **Reconnection Storm**: Toggle phone Bluetooth off and on rapidly 10 times. Does the `BleService` crash, or gracefully debounce back into a connected state?

### 2. Battery Drain Testing
* Measure percentage drain per hour in:
  1. Foreground Active Monitoring
  2. Background Monitoring (Screen off)
  3. Offline Buffer Mode (No internet)

### 3. Intervention UX & Accessibility Validation
* **Screen Reader**: Trigger intervention with VoiceOver/TalkBack active. Is the breathing prompt read cleanly, or does it spam errors?
* **Tremor Test**: Can a user with shaking hands easily hit the "I am safe" dismissal target?

### 4. Offline Recovery
* Connect. Turn on Airplane mode. Wait 10 minutes. Turn off Airplane mode.
* Expectation: UI never locks, all 10 minutes of HR data securely transmit to the backend upon recovery.
