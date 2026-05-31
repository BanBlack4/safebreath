# SafeBreath AI: Phase 1 — DESIGN SYSTEM

## Visual Semantics & Tone
The system fundamentally rejects clinical aesthetics (no stark white dashboards, no aggressive red "Danger" boxes, no jagged EKGs). The interface must lower cortisol, not raise it.

## Typography
*   **Primary/UI Text:** `Inter`. Optimized for legibility under stress. 
*   **Display Text (BPM, Bold Headings):** `Space Grotesk`. Approachable, slightly technical but round and human.

## Calm Palette
*   **Backgrounds:** `slate-950` in Dark Mode, `teal-50` with high-transparency blurs in Light Mode.
*   **Safe Affirmations:** Soft muted Teals and Forest Greens. 
*   **Alert Escalations:** We do not use `#FF0000` red. We use a darker `#7f1d1d` (Burgundy) or Amber, paired with white typography to signify importance without blinding panic.

## UI Primitives
*   **Shadows:** Replaced harsh drop shadows with expansive `0 0 40px rgba(...)` ambient glows.
*   **Borders:** Soft, semi-transparent borders to separate layout without boxing the user in.
*   **Corners:** Ultra-rounded (`rounded-3xl` or `rounded-full`) for a biological, friendly feel.
