# SafeBreath AI: Realtime Live Monitoring Experience

## 1. Emotionally Safe Realtime Design

The Live Monitoring view is the default baseline state of the application. It explicitly avoids the chaotic, high-density look of clinical dashboard screens (no jagged red EKG lines, no overwhelming grids). The goal is to provide quiet reassurance at a glance.

*   **Heart Rate Visualization:**
    *   **Typography:** The current BPM is displayed in a large, rounded, highly legible font (e.g., Space Grotesk) using a soft, high-contrast color against a dark or desaturated background. 
    *   **Smoothing:** Values never "jump" abruptly. They cross-fade or interpolate (e.g., smoothly counting from 70 to 75 over a few frames).
*   **Breathing Visualization (The Anchor):**
    *   Instead of complex multi-axis charts, the primary visual is an organic, slow-moving radial pulse or a gentle rolling wave. It creates a calming rhythm for the user to sync with if they feel anxious.
*   **Signal Quality & Connection UI:**
    *   **Subtle Status:** Deep in the background or corner, a minimal icon indicates sensor fit and BLE signal. 
    *   **Calm/Safe State Indicators:** A prominent text anchor like "Vitals Stable" or "Monitoring Active" in a soft green or teal color provides immediate reassurance.
*   **Offline Buffering Indicators:**
    *   A small, gentle "Offline mode" pill appears at the top if the internet drops. It assures the user that "Live monitoring is active locally" without showing red error triangles.
*   **WebSocket Sync States:**
    *   When reconnected, a very subtle "Syncing..." text or spinning dots appear temporarily. It never blocks the screen with a modal.

## 2. Component Architecture

The interface is broken into highly decoupled React Native components to restrict rerenders to small boundary areas.

*   `DashboardScreen.tsx`: The main orchestrator container. Static layout that rarely rerenders.
*   `TelemetryWaveform.tsx`: An isolated Canvas component (using `react-native-skia` or `react-native-svg`) dedicated solely to drawing the breathing or HR rhythm.
*   `VitalMetric.tsx`: A lightweight numeric component that subscribes directly to the specific metric in the Zustand store to display BPM.
*   `StatusPill.tsx`: Subscribes to the connectivity and BLE status stores.
*   `SignalStrength.tsx`: Passive tracking icon for the wearable.

## 3. Zustand Stores & Telemetry Hooks

*   **Zustand Store (`useTelemetryStore`):**
    *   Splits fast-moving data (BPM, HRV) from slow-moving data (connection status, battery).
    *   Maintains a short rolling array (e.g., last 60 seconds) strictly for the live visualization.
*   **Telemetry Hooks:**
    *   `useLiveHeartRate()`: Provides smoothed, interpolated heart rate values.
    *   `useConnectionState()`: Provides `{ bleConnected, wsConnected, offlineCount }`.
*   **Decoupled Subscriptions:** Components use atomic selectors (`useTelemetryStore(state => state.currentBPM)`) to avoid re-rendering the entire dashboard when a single byte of telemetry updates.

## 4. Animation Strategy & Rerender Optimization

*   **Animation Strategy (Springs & Skia):**
    *   All UI transitions, number interpolations, and breathing rings use `react-native-reanimated` with spring physics for organic motion. No linear easing.
    *   The primary waveform/rhythm visualization runs at 60fps *off the main JS thread* using `react-native-skia`.
*   **Rerender Optimization Strategy:**
    *   **Throttle Store Writes:** The BLE peripheral might send a packet at 1Hz or faster. The background service normalizes it, but we throttle Zustand UI updates to once per 500ms-1000ms to conserve mobile CPU/battery. The numbers are interpolated visually via Reanimated so the user never notices the dropped frames.
    *   **Memoization:** `React.memo` is strictly applied to structural components so they ignore the high-frequency telemetry trickle.

## 5. Websocket Synchronization Flow & Offline Buffering

*   **Websocket Flow:**
    *   A persistent, lightweight WebSocket connection pushes the buffered telemetry array to the cloud in staggered batches (e.g., every 5 seconds) rather than streaming 1:1, drastically saving cellular radio battery.
    *   The server responds with real-time ML inference flags if an anomaly is detected on the broader backend dataset.
*   **Offline Buffering & Re-entry:**
    *   If the WebSocket disconnects, the background service seamlessly routes the BLE ingest directly into WatermelonDB (SQLite).
    *   When the OS triggers a `netinfo` "online" event, the Sync Engine batches the local SQLite rows and quietly dispatches them over REST/WebSockets in the background. The user simply sees the "Offline" chip dissolve away.
