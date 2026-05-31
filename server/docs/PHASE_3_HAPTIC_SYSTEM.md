# SafeBreath AI: Phase 3 — HAPTIC INTERVENTION SYSTEM

## Haptic Guidance Philosophy
During a panic intervention, the user might close their eyes. Haptics become the primary grounding interface.

### Breathing Haptic Patterns
Using `react-native-haptic-feedback` or native Swift/Kotlin modules for custom waveforms:
* **Inhale**: A gentle, escalating continuous pattern (feels like filling a balloon).
* **Hold**: Silence, preceded by a soft, singular "tick" to denote the transition.
* **Exhale**: A descending, heavy resonant vibration.

### Panic Amplification Avoidance
* **No Aggressive Vibrations**: We strictly avoid OS-level "Error" or "Warning" hard staccato vibrations, which simulate alarms and trigger cortisol spikes.
* **Silent Grounding**: The user can place the phone on their chest or hold it in their hand. The vibrations act as an external biological pacemaker.

### Escalation Confirmation
* If the user triggers SOS, the phone performs a distinct "Double Heavy Impact" haptic to confirm dispatch, providing tactile reassurance that help is registered.
