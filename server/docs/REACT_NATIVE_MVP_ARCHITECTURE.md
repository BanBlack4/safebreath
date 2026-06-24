# SafeBreath AI: React Native MVP & Product Experience Architecture

## 1. MVP Product Vision & Usability Principles
The core goal of the React Native MVP is to deliver a functional, emotionally safe, and production-ready product for direct user testing. The interface fundamentally minimizes cognitive load during periods of physiological distress or panic.
*   **Emotional Safety First:** The UI never uses harsh red colors "alarm" sirens or overwhelming medical terminology. We use cool tones, soft haptics, and grounding visual rhythms (e.g., pulsing circles matched to healthy respiratory rates).
*   **Zero-Friction Interactions:** During a panic event, fine-motor skills degrade. All touch targets must be massive (min 48x48px), high-contrast, and require minimal reading.
*   **Offline-First Autonomy:** The core intervention screens and biometric visualizations function 100% locally without cloud connectivity.
*   **Accessibility:** Full compliance with WCAG 2.1 AA, utilizing standard iOS VoiceOver and Android TalkBack native hooks.

## 2. React Native Folder Structure & State Management
```text
/src
  /assets        # Pre-compiled SVGs, Lottie animations, sound vectors
  /components    # Reusable UI system (Buttons, Cards, Modals)
  /screens       # Core navigation views (Dashboard, Vitals, ActiveAlert)
  /navigation    # React Navigation stacks & deep linking
  /hooks         # Reusable React hooks (useBLE, useHeartRate, useSos)
  /services      # BLE abstraction, offline sync orchestrator, auth
  /store         # Local state (Zustand/Redux) and watermelondb schema
  /theme         # Typography, color palettes, semantic dark mode
  /i18n          # Localization maps
```
*   **State Management Strategy:** We utilize `Zustand` for lightweight, non-blocking UI state combined with `WatermelonDB` for asynchronous, offline-first SQLite persistence.
*   **BLE Integration Frontend:** The `react-native-ble-plx` library is abstracted behind a custom `useBLE` hook, emitting sanitized `(HR, HRV, SpO2)` tuples to the local Zustand store, ensuring the UI 60fps thread never blocks waiting for Bluetooth GATT responses.

## 3. Core Navigation & Onboarding Experience
*   **Authentication Flow:** Zero-password onboarding using Biometrics (FaceID/Fingerprint) / Apple Sign In / Google Auth.
*   **Progressive Onboarding:**
    1.  *Identity:* Basic demographic and health boundaries.
    2.  *Pairing:* The Wearable Pairing Flow displays scanning radar animations. Devices connect automatically via proximity (RSSI strength).
    3.  *Permissions:* Contextual requests for Bluetooth and Background Location (only asked when explicitly needed, thoroughly explaining the safety benefits).
*   **Navigation System:** A native Bottom Tab Navigator (Dashboard, History, Profile) with aggressive modal stacking for the `ActiveAlert` intervention screens.

## 4. Intervention Screen Architecture & Panic Escalation UX
*   **Panic Escalation UX:** When an anomaly is detected, the UI transitions smoothly (no stark flashes).
    *   **Phase 1 (Check-in):** A gentle, non-intrusive modal asks "Are you feeling okay?" with a clear 15-second countdown ring. 
    *   **Phase 2 (Intervention):** If unacknowledged, or if vitals spike further, the screen locks into "Grounding Mode". The user sees a slow, expanding/contracting sphere simulating diaphragmatic breathing.
    *   **Phase 3 (SOS Escalation):** If vitals breach critical thresholds, a highly visible "Hold to call SOS" slider appears, replacing standard buttons to prevent accidental dials.
*   **Trusted Contacts UX:** Users configure 3 core contacts. During an active escalation, a "Notify Contacts" button triggers a silent backend SMS dispatch containing a secure web-link with their realtime status and GPS coordinates.

## 5. UI Component Design System
*   **Color Semantics:** 
    *   *Primary (Calm):* Deep Teal (`#00796b`) and Soft Cyan (`#a4f0e9`).
    *   *Elevation (Warning):* Soft Amber/Ochre (avoiding pure aggressive hazard-orange).
    *   *Surfaces:* Slate and Charcoal for Dark Mode (`#05141a`); pure whites are avoided to reduce eye strain.
*   **Typography System:** 
    *   *Headers:* `Space Grotesk` - clean, modern, easily scannable figures.
    *   *Body:* `Inter` - highly legible for medical/system text.
*   **Animation System:** Utilizing `react-native-reanimated`. All transitions use spring physics (not linear easing) to feel organic and natural to the human eye. 
*   **Dark Mode Architecture:** Handled natively via `useColorScheme`. The UI components rely on semantic color tokens (`background.primary`, `surface.alert`) mapped dynamically, fully supporting high-contrast mode toggles in the OS.

## 6. Realtime Telemetry & Offline Synchronization UX
*   **Realtime Dashboard:** Features a smooth waveform component (using `react-native-skia` for 60fps vector rendering). It visualizes Heart Rate bounding boxes.
*   **Offline Synchronization UX:** When disconnected, a subtle icon appears. The user interactions remain totally unimpeded. Upon network restoration, an "Updating..." spinner is relegated to the background, preventing blocking modals.
*   **Notification Architecture:** High-priority notifications bypass standard "do not disturb" (Critical Alerts capability in iOS) *only* for verified SOS events, while daily wellness summaries are delivered silently.
