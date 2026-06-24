# SafeBreath AI: Sprint 1 — REDUCED MOTION ACCESSIBILITY

## Reduced-Motion Animation Architecture
We respect the operating system's `.prefers-reduced-motion` settings or explicit app-level toggles to accommodate vestibular sensitivity and neurodivergent load.

### Transition Variants
*   **Default:** `scale: [0.95, 1]`, `opacity: [0, 1]`, `blur-filters`.
*   **Reduced Motion:** Core scaling is abandoned. `opacity: [0, 1]` with a slower, linear ease. Blurs are completely disabled. 

### Breathing Visual Complexity
Instead of overlapping, high-computation `mix-blend-screen` circles scaling up and down, the reduced-motion fallback provides a simple, solid soft-teal circle that gently modulates opacity (`0.4` to `0.8`) with zero border transformations.

### Panic Sensitivity Constraints
When a user is actively experiencing high cortisol or dissociation, aggressive animations can "snap" attention in a startling way. Reduced motion guarantees that the interface fades into view gently, acting as a passive anchor rather than a flashing alarm.
