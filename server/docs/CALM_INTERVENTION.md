# SafeBreath AI: Calm Intervention Experience

## 1. Emotional Regulation UX & Design Philosophy

The Calm Intervention mode is activated when the system detects a potential physiological anomaly (e.g., sudden heart rate spike). Its primary goal is **de-escalation through grounding**, transforming the device from a passive monitor into an active emotional anchor.

*   **Low-Stimulation Fullscreen Mode:** The moment intervention triggers, all complex telemetry (BPM numbers, battery icons, historical graphs) is swept away. Cognitive load drops to zero. The screen becomes an expansive, soft, single-focus interface.
*   **Cognitive Load Reduction:** A panicked brain cannot read paragraphs, make complex decisions, or navigate menus. The UI must provide a single, undeniable focal point with no more than two massive, permissive interaction targets (e.g., "I am safe" and "I need help").
*   **Panic-Safe Motion Design:** Panic induces tunnel vision and light sensitivity.
    *   No hard cuts or snapping transitions.
    *   Use organic, volumetric motion (expanding and contracting spheres or fluid waves).
    *   Colors shift to muted, warm ambers or deep, soothing teals.
*   **Intervention Timing Principles:** The intervention does not start with an alarm. It starts gently. "Let's take a breath together." It progressively waits for user stabilization. If stabilization fails over a set threshold (e.g., 2 minutes), it gracefully offers escalation to emergency contacts.
*   **Alert Fatigue Prevention:** If an intervention was triggered by mild exertion rather than distress, dismissal must be frictionless. Over-communicating "danger" when the user is fine creates the "boy who cried wolf" effect, degrading trust.

## 2. Component Hierarchy

The intervention view overrides the navigation stack with an absolute full-screen modal.

*   `InterventionModal.tsx`: The root full-screen container handling the dark overlay and trapping navigation.
*   `BreathingCanvas.tsx`: The core visual engine. Renders the massive expanding/contracting sphere using `react-native-reanimated` or `react-native-skia`.
*   `GuidanceText.tsx`: A single, large, central string of text ("Inhale...", "Hold...", "Exhale...") smoothly fading in and out.
*   `GroundingControls.tsx`: The bottom interaction zone containing two massive targets:
    *   A soft "I feel okay" dismissal button.
    *   A slide-to-act "Need Help?" trigger that transitions to the Active Alert/SOS screen.

## 3. Breathing Rhythm & Haptic Timing System

The core of the intervention is pacing the user's breathing (down-regulation).

*   **Breathing Rhythm System (4-7-8 or Box Breathing):**
    *   The system uses established diaphragmatic breathing patterns.
    *   Example: 4s Inhale (Sphere expands smoothly) -> 4s Hold (Sphere subtly pulses at max size) -> 6s Exhale (Sphere contracts slowly).
    *   The animation uses customized spring physics to feel like a real inflating lung, not a linear robotic slider.
*   **Haptic Timing System:**
    *   Visual guidance requires the user to look at the screen. Haptic guidance allows them to close their eyes (a common grounding technique).
    *   **Inhale:** A continuous, slowly escalating gentle vibration (using `react-native-haptic-feedback`).
    *   **Hold:** Silence or a very faint "tick" at the beginning and end.
    *   **Exhale:** A continuous, slowly descending, deep resonant vibration.
    *   *Crucial:* These are NOT sharp "error" buzzes. They are customized, rich haptic patterns that feel like a heartbeat or a deep purr.

## 4. Animation Logic & State Transitions

*   **Entry Transition:** When triggered, the Dashboard doesn't disappear instantly. A dark, translucent scrim fades over the UI over 1.5 seconds. The breathing sphere fades in from the center, growing from nothing to its starting size. This prevents the "startle response."
*   **Progressive Escalation UX:**
    *   *Phase 1 (Minute 0-1):* Pure focus on breathing. Only the dismissal button is prominent.
    *   *Phase 2 (Minute 1-2):* If telemetry remains unstable or the user interacts slowly, the "Slide to SOS" component gently fades into the bottom of the screen.
*   **Exit Transition:** Upon the user tapping "I feel okay" locally or vitals returning to baseline, the sphere gently shrinks to zero, the dark overlay fades out, and the standard dashboard fades back in.

## 5. Accessibility-Safe Interactions

*   **VoiceOver/TalkBack:** Standard screen readers reading "Inhale" every 4 seconds can sound demanding and robotic. We implement custom accessibility announcements: "Guided breathing active. Please follow the haptic vibrations to inhale and exhale." 
*   **Visual Contrast:** The breathing sphere uses a high-contrast desaturated color against a near-black background to accommodate users with anxiety-induced photophobia (light sensitivity).
*   **Touch Targets:** The "I feel okay" button is massively oversized (e.g., 80px height, full screen width minus padding) so a shaking hand cannot miss it.
