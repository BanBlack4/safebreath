# SafeBreath AI: Closed Alpha - Phase 4 Operations

## Testing the Human Element

### 1. Alpha Onboarding & Consent
Users must sign digital disclaimers acknowledging:
*   SafeBreath is an **experimental emotional support tool**, NOT a certified medical diagnostic device (FDA/CE).
*   It does not guarantee dispatch of 911/emergency services.
*   Vitals monitoring may drop or glitch.

### 2. Feedback Reporting Pipeline
The alpha app features a "Shake to Report" gesture.
*   When shaken, the app captures the last 60 seconds of UI state, BLE connection logs, and WebSocket RTT latency.
*   The user is prompted: "What felt wrong?"
*   This encrypted diagnostic bundle is shipped to our secure backend staging bucket for analysis.

### 3. Emergency Handling Guidance
If a user escalates via the "Slide to SOS" button during the alpha phase, the app will:
1.  Play the heavy double-haptic confirmation.
2.   Display a local prompt verifying if they want to call their assigned Alpha Emergency Contact or 911 directly using the device dialer.
3.  We do **not** use autonomous headless Twilio dispatch in the Alpha until false-positive rates drop below 1%.
