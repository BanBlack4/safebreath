# SafeBreath AI: Sprint 1 — NIGHT MODE OPTIMIZATION

## Sleep-Safe Visuals
Users may experience distress during the night. A night-triggered alert must not flashbang the user.
*   **Pure Black Canvas:** Background shifts from `slate-950` to `black` (#000000) to ensure OLED subpixels completely power off, reducing total light emission.
*   **Contrast Reduction:** White text (`#ffffff`) is dimmed to a soft slate (`#e2e8f0` or `#cbd5e1`).
*   **Intervention Easing:** If an anomaly is detected at 3:00 AM, the screen fades in from pure black over 3 seconds, rather than snapping on. The haptics start at the lowest possible resonance and gently escalate.
