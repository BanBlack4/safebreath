# SafeBreath AI: Phase 2 — LIVE MONITORING EXPERIENCE

## Realtime Visualization Polish
The dashboard now implements a massive, soft radial gradient behind the heart rate.
*   The heartbeat number counts up/down via strict easing interpolation—no jagged single-digit jumps.
*   A slow, 1.5s repeating soft scale animation creates a biological "breathing ring" that users can passively sync with, even if no intervention is active.

## Cognitive Load Management
*   We removed raw sensor data text strings (e.g., HRV: 45ms, RSSI: -82) from the primary view. Instead, we use a single, undeniable "Vitals Stable" text badge.
*   Offline transitions don't block the screen. A tiny amber pill falls from the top with the words "Offline • Monitoreo Local" so the user knows they are still protected without internet.

## Adaptive UI States
*   **Waiting for Sensor:** High opacity fading to 50%, no blinking elements.
*   **Active:** Soft `#14b8a6` teal highlights. Large typography.
