# SafeBreath AI: MVP Screen Architecture

## 1. Splash Screen
*   **Emotional Objective:** Immediate reassurance, stability, grounding transition into the app.
*   **UX Behavior:** A slow, soft breathing animation of the brand logo (deep teal). No sudden flashes.
*   **Realtime Interaction Rules:** Non-interactive. Delays slightly if app needs to load local DB, minimum display of 1.5s to establish pacing.
*   **Accessibility Constraints:** Must support reduced motion OS settings (fade instead of scale animation).
*   **State Transitions:** Fades seamlessly into Welcome (if logged out) or Live Monitoring (if logged in).
*   **Empty/Error/Offline States:** Offline state is silent; loads immediately into cached app state.

## 2. Welcome & Auth Screen
*   **Emotional Objective:** Trust and low friction.
*   **UX Behavior:** Clean, sparse layout. Single "Continue with Fingerprint/Face ID" or OS-native Auth.
*   **Realtime Interaction Rules:** Tap once, wait for biometric validation.
*   **Accessibility Constraints:** High contrast large text. Buttons minimum 48px height.
*   **State Transitions:** On success, slide to Onboarding (first time) or Live Monitoring.
*   **Error States:** Soft error modal: "Authentication failed. Try again or use PIN." (No harsh red boxes).

## 3. Onboarding
*   **Emotional Objective:** Empowerment and transparency. No medical intimidation.
*   **UX Behavior:** 3-step carousel. Large, friendly typography explaining app value.
*   **Realtime Interaction Rules:** Swipe to progress, simple single-choice sliders for baseline context.
*   **Accessibility Constraints:** Screen reader must read current step index (e.g., "Step 1 of 3: Setting your baseline").
*   **State Transitions:** Slides laterally. Proceeds to Permissions on completion.
*   **Empty States:** Default sliders to safe/average baselines.

## 4. Permissions
*   **Emotional Objective:** Safe disclosure. Explaining *why* tracking is helpful, not invasive.
*   **UX Behavior:** Clear, plain-English explanations for Bluetooth and Location.
*   **Realtime Interaction Rules:** Context-aware tap to trigger OS permission modals.
*   **Accessibility Constraints:** Focus order must prioritize the explanation text before the "Allow" button.
*   **State Transitions:** Advances automatically upon permission grant.
*   **Error States:** "Without Bluetooth, we can't read your sensor. We'll wait until you're ready." 

## 5. BLE Pairing
*   **Emotional Objective:** Frictionless magic. Removing "tech anxiety."
*   **UX Behavior:** Gentle radar animation. Auto-scans for nearby approved wearables.
*   **Realtime Interaction Rules:** Tap "Connect" when device appears. Haptic tap on successful pair.
*   **Accessibility Constraints:** Haptic and audio feedback confirming successful connection.
*   **State Transitions:** Once paired, transitions to Live Monitoring.
*   **Error/Empty States:** "No devices found." Soft pulsing button to "Search Again".
*   **Offline States:** Only requires Bluetooth, network not needed to pair.

## 6. Live Monitoring (Dashboard)
*   **Emotional Objective:** Calm oversight. "Everything is okay."
*   **UX Behavior:** A fluid, slow-moving telemetry waveform. Prominent "I feel safe" visual anchor.
*   **Realtime Interaction Rules:** 60fps waveform rendering via Skia. Values interpolate seamlessly (no jumping numbers).
*   **Accessibility Constraints:** Heart rate read aloud as a stable summary ("Heart rate stable at 65 BPM"), not spoken every tick.
*   **State Transitions:** If anomaly detected, slow cross-fade to Calm Intervention.
*   **Offline States:** Small "Offline" chip appears. Waveform continues uninterrupted using local Bluetooth feed.

## 7. Calm Intervention (Provisional Alert)
*   **Emotional Objective:** De-escalation and grounding.
*   **UX Behavior:** Modal slides up. "Are you feeling okay?" Soft amber tonal shift.
*   **Realtime Interaction Rules:** 15-second radial countdown. Massive "I'm OK" dismissal button.
*   **Accessibility Constraints:** High contrast text on amber. Audio chime to indicate prompt.
*   **State Transitions:** Dismiss -> Dashboard. Ignore/Escalate -> Active Alert.
*   **Error States:** None. Fails safe to Active Alert if unresponsive.

## 8. Active Alert (Panic Validation)
*   **Emotional Objective:** Anchoring and emergency prevention.
*   **UX Behavior:** Strips away UI complexity. Full-screen expanding/contracting sphere (diaphragmatic breathing pacing).
*   **Realtime Interaction Rules:** "Hold to breathe alongside the circle." At bottom: "Slide to Dispatch SOS".
*   **Accessibility Constraints:** Screen reader announces "Breathing exercise active. Inhale. Exhale."
*   **State Transitions:** Resolves back to Dashboard if vitals stabilize.
*   **Offline States:** Fully functional locally. "Slide SOS" queues SMS dispatch for cellular fallback.

## 9. Trusted Contacts
*   **Emotional Objective:** Connectedness and security.
*   **UX Behavior:** Simple list view. Add from native phonebook. No complex forms.
*   **Realtime Interaction Rules:** Tap to edit or remove. Toggle "Active" per contact.
*   **Accessibility Constraints:** Avatar images must have `aria-label` with contact name.
*   **Error States:** "Contact missing phone number."
*   **Offline States:** Cached locally, cannot add new server-based contacts until reconnected.

## 10. Telemetry History (Journey)
*   **Emotional Objective:** Reflection and pattern awareness (without triggering rumination).
*   **UX Behavior:** Smoothed historical charts. Focuses on daily ranges, not minute-by-minute spikes to avoid medical obsessive analysis.
*   **Realtime Interaction Rules:** Swipe to scrub timeline.
*   **State Transitions:** Drill down into specific past anomalous events to add contextual journal notes.
*   **Empty States:** "Your journey begins today. We are recording your baseline."
*   **Offline States:** Shows locally cached days. "Syncing paused."

## 11. Offline Sync (Background/Passive Screen)
*   **Emotional Objective:** Reliability.
*   **UX Behavior:** Not a full screen, but a persistent status indicator in the top header or notification center.
*   **Realtime Interaction Rules:** Quietly spins or fills a cloud icon when re-establishing connection.
*   **Accessibility Constraints:** Screen reader does not announce syncs unless explicitly focused.
*   **Error States:** Retries exponentially in the background without bothering the user.

## 12. Device Health
*   **Emotional Objective:** Predictability. Stopping anxiety about dead batteries.
*   **UX Behavior:** Clear visuals of watch/ring battery levels and sensor fit quality.
*   **Realtime Interaction Rules:** Updates battery incrementally.
*   **State Transitions:** Tap a device to access recalibration or disconnect options.
*   **Error States:** "Sensor fit poor. Please tighten your watch."

## 13. Settings & Privacy
*   **Emotional Objective:** Total control and boundary respect.
*   **UX Behavior:** Standard OS-native list layout. Clear toggles for data sharing, location tracking, and account deletion.
*   **Realtime Interaction Rules:** Toggles yield instant local state updates.
*   **Accessibility Constraints:** High contrast toggle switches mapped to native accessibility roles.
*   **Offline States:** Privacy toggles persist locally and queue for server sync.
