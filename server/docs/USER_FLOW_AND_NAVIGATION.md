# SafeBreath AI: User Flow & Navigation System

## 1. Flow Architectures

### Authentication & Onboarding Flow
*   **Authentication Flow:** Zero-password philosophy. Users authenticate via native Biometrics (FaceID/TouchID) or single-tap OAuth (Apple/Google). Reduces cognitive friction during setup.
*   **Onboarding Flow (Low-Friction):**
    1.  *Welcome Vector:* Gentle, calming animation introducing the core value (peace of mind).
    2.  *Baseline Setup:* Simple sliders for age and general activity level to seed the baseline engine (no complex medical forms).
    3.  *Permissions:* Context-aware prompt explaining *why* background Bluetooth and location are needed for safety, asked right before pairing.

### Wearable Pairing & BLE Flow
*   **BLE Pairing Flow:** The UI uses a soft, radiating radar animation. Devices are discovered automatically via RSSI proximity. The user simply taps "Connect" next to their device name.
*   **Wearable Reconnect UX:** Disconnections happen. If a wearable drops, a *subtle* greyed-out icon appears. No intrusive popups. Reconnections happen silently in the background with a gentle haptic "tap" upon success.

### Core Lifecycle Flows
*   **Live Monitoring Flow:** The default state when opening the app. A clean dashboard showing a smooth, rolling waveform, current heart rate in large typography, and a prominent "I feel safe" status indicator.
*   **Intervention Flow:** Triggered by the deterministic engine. The screen transitions from the dashboard to a full-screen, uninterrupted breathing guide (expanding/contracting sphere) with minimal text.
*   **Emergency Escalation Flow:** If the intervention fails to stabilize the user, the UI swaps to the SOS screen. Uses the high-friction "Slide to Dispatch SOS" component to prevent accidental calls while providing a clear physical action.
*   **Trusted Contacts Flow:** Managed in settings. Users can add up to 3 contacts. During an SOS, these contacts receive an SMS containing a secure web link with the user's status and location.

### Resilience Flows
*   **Offline Recovery Flow:** If the app loses internet connection, the UI remains 100% functional. A small "Offline Mode" chip appears. When reconnected, telemetry syncs silently in the background without blocking the UI thread.
*   **Notification Flow:** Standard notifications (daily summaries) are delivered silently. Critical alerts (SOS intervention required) bypass DND mode to deliver a specialized, calming but persistent haptic pattern.

## 2. Navigation System & Hierarchy

### Tab & Stack Architecture
The app utilizes a standard React Navigation architecture but prioritizes shallow depth to prevent users from getting lost. 
*   **Root Stack:**
    *   `AuthNavigator` (Login, Onboarding)
    *   `MainTabNavigator` (Dashboard, Journey/History, Profile/Settings)
    *   `EmergencyModal` (A full-screen modal stack that sits *above* everything else).

### Emergency Interruption Rules
*   **Absolute Override:** The `EmergencyModal` has the absolute highest z-index and routing priority. If an anomaly is validated, this modal interrupts the user instantly, regardless of what tab or settings view they are currently localized in.
*   **Trap Navigation:** Once inside the `EmergencyModal`, the standard back button and swipe-to-go-back gestures are disabled. The user must explicitly hit "I am safe" or "Cancel" to dismiss the intervention. This prevents accidental dismissal during a panic attack.

### Deep-Link Strategy
*   OS-level widgets or incoming SOS verification SMS links utilize deep-linking (`safebreath://alert/verify`) to route the user immediately into the active intervention screen, bypassing the dashboard entirely for speed.

## 3. UX Continuities & Emotional Transitions

### Emotional State Transitions
*   **Calm to Alert:** The transition from the Dashboard (Blue/Teal) to the Check-In modal (Soft Amber) must be fluid—a slow fade over 1.5 seconds. Sudden snapping or harsh color switching triggers the amygdala's startle response, exacerbating anxiety.
*   **Alert to SOS:** Transitioning from the breathing sphere to the SOS slider involves a deliberate shift in UI density, focusing entirely on the slider track.

### Panic-Safe Navigation
Panic drastically reduces peripheral vision (tunnel vision) and fine motor skills. 
*   No hamburger menus during an alert.
*   No complex scrolling required to find the "Help" button. 
*   Core actions are permanently anchored to the bottom third of the screen (the easiest thumb-reach zone).

### Offline UX Continuity
A panicked user must not confront a "Network Error: 500" or infinite spinning loading wheel during an intervention. The UI must instantly fall back to local Zustand/SQLite caches, assuring the user that the app's grounding features still work perfectly even in an elevator or subway where signal is dead.
