# SafeBreath AI: Closed Alpha - Phase 5 Human Testing Strategy

## Validation Scenarios

We are testing physiological safety, UX ergonomics, and software resilience.

### 1. Panic Episode Simulations
*   **Goal:** Evaluate the UX effectiveness of the Calm Intervention.
*   **Test:** Tester purposely elevates HR via exercise, then triggers the app to enter Intervention mode. Tester evaluates the haptic pacing, visual blur, and typography legibility while out of breath.

### 2. False Positive Evaluations
*   **Goal:** Track Alert Fatigue.
*   **Test:** User wears the band during varied non-panic activities (brisk walking, watching a scary movie). If the app triggers the "Are you okay?" prompt, we time how fast the user dismisses it. 
*   **Metric:** False alarms must be dismissed in under 3 seconds without causing frustration or residual anxiety.

### 3. Nighttime Monitoring Tests
*   **Goal:** Background resilience and battery burn.
*   **Test:** Phone sits locked on nightstand while wearable streams data all night.
*   **Metric:** Phone battery drain < 10% overnight. App must not be killed by OS Doze mode.

### 4. Low Connectivity Testing
*   **Goal:** Evaluate the offline sync engine.
*   **Test:** Tester enters an elevator or subway drop zone while generating high-variance HR data.
*   **Metric:** The app displays the amber "Offline" pill. When tester emerges, 100% of the buffered HR array is replayed perfectly to the cloud without locking the UI thread.
