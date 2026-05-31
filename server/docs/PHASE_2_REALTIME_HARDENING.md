# SafeBreath AI: Phase 2 — REALTIME PERFORMANCE HARDENING

## Telemetry Rendering Optimization
High-frequency telemetry updates (e.g., 1Hz to 5Hz BLE streams) can crush mobile UI threads if not managed properly.

### Render Isolation Architecture
* The main dashboard never re-renders on every heartbeat.
* `MetricDisplay` components use direct Zustand selectors (`useTelemetryStore(state => state.liveBpm)`) to isolate updates to just the text node.

### Zustand Update Batching
* Instead of dispatching strict individual `addTelemetryPoint` actions at 5Hz, the BLE worker buffers points and flushes them to the Zustand array at 1Hz or 2Hz, visually smoothing the transition.

### Animation Smoothness & Interpolation
* The heart rate number uses `react-native-reanimated` to smoothly count up or down.
* The breathing waveform offloads entire render paths to `react-native-skia`, drawing directly on the GPU without crossing the JS bridge every frame.

### Low Battery Rendering Strategies
* If device battery < 15%:
  * Skia rendering is down-clocked.
  * Complex shaders are skipped.
  * Websocket sync interval is extended from 5s to 60s to save radio power.
