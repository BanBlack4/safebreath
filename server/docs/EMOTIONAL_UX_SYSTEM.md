# SafeBreath AI: Emotional-Safe UX & Interaction System

## 1. Emotional UX Principles
The SafeBreath AI user interface is built on the philosophy of "De-escalation by Design". During a physiological or emotional crisis, cognitive processing drops significantly. The UI must act as an anchor, not an amplifier, guiding the user back to baseline.

*   **Do No Harm (No Anxiety Amplification):** Never display aggressive red flashing screens, blaring sirens, or clinical terminology that could convince a panicking user they are dying.
*   **Massive, Permissive Touch Targets:** Panic drastically reduces fine motor skills. 48x48px is the minimum touch target; primary intervention targets should be spanning the full width of the screen.
*   **Low Cognitive Load:** Eliminate choices during an active alert. A panicked user cannot read paragraphs or navigate sub-menus. Use single, clear directives (e.g., "Breathe", "Hold for Help").
*   **Reassurance through Stability:** Real-time telemetry must appear smooth, purposeful, and contained, never erratic or jittery. 

## 2. Color Semantics & Typography
*   **Color Semantics (Low Stimulation)**
    *   *Baseline (Calm):* Deep Teals (`#004D40`), Muted Cyans (`#E0F2F1`). Feels grounded and natural.
    *   *Elevation (Attention):* Soft Ochre or Warm Amber (`#FFC107`). Avoid pure hazard orange.
    *   *Surfaces:* Slate Grays (`#1E293B`) or Soft Off-Whites (`#F8FAFC`). Pure blinding white and pure pitch black cause eye strain.
*   **Typography Hierarchy**
    *   *Display/Metrics:* **Space Grotesk** - Highly legible figures for heart rates and timers. Avoid "tech" mono-fonts that feel too clinical.
    *   *Body/Guidance:* **Inter** - Clean, neutral, high-contrast. Maximize leading (line spacing) to make reading effortless.
*   **Dark Mode Rules:** Dark mode is heavily prioritized as light sensitivity is common during migraines or severe anxiety. It must rely on desaturated secondary colors rather than stark neon contrasts.

## 3. Motion Design & Haptic Feedback
*   **Motion Design Rules:**
    *   No linear easing. All animations must use slow, continuous *spring physics* to feel organic, simulating breathing, water, or gravity.
    *   No stark blinding flashes or rapid blinking. Use slow cross-fades and pulsating opacities.
*   **Haptic Feedback Guidelines:**
    *   Avoid high-frequency "buzzing" common in alarm clocks.
    *   Use deep, resonant, rhythmic haptics synced to deep breathing rhythms (e.g., 4 seconds inhale/vibrate, 4 seconds hold, 6 seconds exhale/release).

## 4. Alert Hierarchy & Panic-Safe Interaction Patterns
*   **Level 1: Passive Baseline:** App displays historical trends and gentle waveform. 
*   **Level 2: Check-In (Provisional Anomaly):** Fluid modal slides up. "Are you feeling okay?". The user has 15-30 seconds to dismiss. Interaction is a simple fat button tap.
*   **Level 3: Grounding Mode:** The UI strips away all complex telemetry. A single, large pulsating sphere guides diaphragmatic breathing.
*   **Level 4: Critical SOS:** Complex actions are replaced with high-friction, error-proof interactions, such as a **"Slide to Dispatch SOS"** input. This prevents accidental emergency calls caused by shaking hands while providing a clear physical action to request aid.

## 5. Accessibility & Low-Stimulation UI Behaviors
*   **WCAG 2.1 AA Compliance:** Minimum 4.5:1 contrast ratios. Support for Dynamic Type (system-wide text scaling).
*   **Screen Reader Optimization:** Native iOS VoiceOver and Android TalkBack support. Real-time telemetry is *not* read aloud constantly (which would be overwhelming). Instead, VoiceOver announces stable state changes: "Heart rate is elevating. Would you like to begin a breathing exercise?"

---

# Explanations of Emotional UI Tradeoffs

## Why Aggressive Medical UI is Dangerous
Standard medical monitoring screens (like hospital EKGs) use harsh reds, sharp zig-zags, and loud beeps because they are designed for doctors to notice them across a noisy room. Exposing a patient to this raw, erratic data during an anxiety attack is deeply harmful. It creates a negative biofeedback loop: the user sees a sharp, red heart rate line, panics more, raising their heart rate further. The UI must decouple the *alert* from the *presentation of the alert*.

## Preventing Anxiety Amplification
Realtime data must be smoothed and bounded. If a heart rate jumps from 100 to 110, the UI should smoothly transition over 1-2 seconds using interpolating animations, rather than instantly snapping. The UI never acts surprised. By presenting severe data in a calm, controlled, and visually soft manner, the app communicates to the user: "This event is recognized, contained, and manageable."

## Realtime Telemetry's Emotional Feel
Telemetry should look like a natural rhythm, not an erratic stock market chart. Waveforms should use thick, rounded strokes (`stroke-linecap="round"`) with gentle, flowing interpolation. It should feel like tracking the rolling tide on a beach—a natural biological process—not a machine about to crash.

## Preventing Alert Fatigue
If the system buzzes the user aggressively every time they walk up a flight of stairs, the user will associate the app with annoyance, not safety, and eventually ignore it. Low-level contextual alerts must be entirely silent and visually non-intrusive. True disruption (noise & vibration) is strictly reserved for instances where the physiological boundaries reach critical safety limits or prolonged distress without contextual explanation.
