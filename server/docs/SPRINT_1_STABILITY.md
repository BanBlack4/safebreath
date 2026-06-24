# SafeBreath AI: Sprint 1 — STABILITY HARDENING

## Runtime Resilience
*   **Stale-State Recovery:** If React's render thread stalls and the BPM drops to zero inappropriately, a silent watchdog forces a UI reconciliation via Zustand without destroying local state.
*   **Frame-Drop Protection:** Interventions avoid expensive React state recalculations during the 60-second breathing loop, relying entirely on CSS/Reanimated interpolated values.
*   **Offline State Reconciliation:** The `SyncEngine` locks offline rows in SQLite to prevent duplicate dispatches if the websocket bounces rapidly.
