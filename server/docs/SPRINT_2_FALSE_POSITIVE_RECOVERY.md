# SafeBreath AI: Sprint 2 — FALSE POSITIVE RECOVERY UX

## Graceful Recovery
A false positive (e.g., the user is just running up stairs) should not feel like an error or a failure.

### "I'm OK" Flows
*   The intervention screen features a clear, large "Estoy Bien (Ignorar)" button. 
*   If clicked, the app softly dismisses the alert without demanding an immediate survey.

### Sensor Instability
If the BLE drops and reconnects, we do not throw error modals. A silent background pill indicates "Reconectando", preserving emotional equilibrium.

### Exercise Mode (Future)
Future iterations might include a quick toggle to suppress interventions during workouts to avoid alert fatigue. For now, the dismissal must be frictionless enough that a workout false positive takes < 2 seconds to clear.
