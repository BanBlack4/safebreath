# SafeBreath AI: Sprint 1 — LOW BATTERY MODE

## Adaptive Rendering Degradation
When the device battery drops below 20%, or Low Power Mode is OS-activated:
*   **Animation Frequency:** Continuous infinite loops (like the heartbeat ring) are paused.
*   **UI Updates:** The BPM readout updates at 1Hz instead of interpolating sub-second changes.
*   **Shadows/Gradients:** Expensive `backdrop-blur-xl` and complex radial gradients fall back to solid opacity-based background colors (e.g., `bg-[#0a232f]/90`).

## Core Safety Preservation
Even in maximum battery degradation:
1.  The BLE connection remains active in the background.
2.  Offline telemetry buffering continues.
3.  The intervention screen still bounds the user, but abandons visual GPU effects in favor of pure haptic and text-based pacing.
