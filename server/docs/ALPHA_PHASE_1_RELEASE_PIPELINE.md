# SafeBreath AI: Closed Alpha - Phase 1 Release Pipeline

## Mobile Release Infrastructure
We utilize Expo Application Services (EAS) to orchestrate React Native builds, ensuring consistency across developers and CI/CD environments.

### 1. Build & Distribution
*   **Android Internal Testing:** APKs and AABs are generated via `eas build -p android --profile preview`. These are distributed to the closed alpha group via Google Play Console Internal Testing track.
*   **iOS TestFlight:** IPAs are built securely using `eas build -p ios --profile production` and uploaded directly to App Store Connect for TestFlight deployment.

### 2. Environment Separation
*   `development`: Points to local or staging backend, full React Native dev menu enabled, mocked BLE tools available.
*   `preview` (Staging): Points to production-replica database, real BLE required, dev console obfuscated (hold title 5s).
*   `production`: Strict production API, fully obfuscated, OTA updates enabled.

### 3. OTA Update Strategy
*   Using `expo-updates` to push JS bundle fixes (UI tweaks, animation fixes, intervention copy changes) without going through App Store review.
*   **Rollback Strategy:** If a new OTA update causes a spike in Sentry crash reports (>2% session crash rate), the CI automatically invokes an OTA rollback to the previous stable channel release.

### 4. Deployment Checklist
*   [ ] Increment build number and SemVer version.
*   [ ] Verify SDK/Dependency compatibility.
*   [ ] Check environment variables (API URLs, WebSocket endpoints).
*   [ ] Ensure Sentry DSN is injected correctly for the target environment.
