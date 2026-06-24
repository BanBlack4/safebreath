# SafeBreath AI: Sprint 2 — HUMAN FEEDBACK LOOP

## In-App Feedback Collection
We need to learn from the Alpha without breaking the calming UX.

### Post-Intervention Check-ins
*   If a user dismisses an intervention, a non-blocking toast might appear 5 minutes later: "¿Fue útil la pausa? [Sí] [No]"
*   If "No", we log the false positive to refine the detection algorithms.

### Trust Scoring
*   Occasional, lightweight prompts asking "SafeBreath te hace sentir seguro/a?" to gauge the emotional effectiveness of the design.

### False-Positive Reporting
*   If the user hits "Estoy Bien (Ignorar)", we mark the telemetry snippet as a false positive, helping tune the background ML models (if any) or standard deviation thresholds. We do not blame the user for "moving too much".
