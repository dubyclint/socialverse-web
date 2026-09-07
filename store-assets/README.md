# Viorp — store submission package

Production domain: **viorp.com**
Bundle ID / applicationId: **com.viorp.app** (override with `CAPACITOR_APP_ID`)

## 1. Source art (place here, then generate)

| File | Size | Purpose |
|---|---|---|
| `assets/icon-only.png` | 1024×1024, transparent | iOS + PWA icon |
| `assets/icon-foreground.png` | 1024×1024, transparent | Android adaptive foreground |
| `assets/icon-background.png` | 1024×1024, solid `#0A0F1E` | Android adaptive background |
| `assets/splash.png` | 2732×2732 | Light splash |
| `assets/splash-dark.png` | 2732×2732 | Dark splash |

Generate every native/PWA size:

```bash
npm run assets:generate     # npx capacitor-assets generate
```

## 2. Builds

```bash
npm run build:web           # SSR web (unchanged behaviour)
npm run build:mobile        # CAPACITOR_BUILD=true nuxt generate + cap sync
npx cap add android         # first time only
npx cap add ios             # first time only, macOS
```

## 3. Deep links

Both association files are served dynamically by the web app and require env vars on the
production deployment:

- `https://viorp.com/.well-known/assetlinks.json` → set `ANDROID_CERT_SHA256`
  (comma-separated SHA-256 fingerprints from `keytool -list -v -keystore viorp-release.jks`)
  and optionally `ANDROID_PACKAGE_NAME`.
- `https://viorp.com/.well-known/apple-app-site-association` → set `APPLE_TEAM_ID`
  and optionally `IOS_BUNDLE_ID`.

Until those are set the routes return 503 rather than serving a fingerprint that would fail
verification. Custom scheme for OAuth callbacks: `viorp://`.

## 4. Google Play

- `targetSdkVersion` / `compileSdkVersion` **35** in `android/variables.gradle`.
- Release output must be an **AAB**:

  ```bash
  keytool -genkey -v -keystore viorp-release.jks -keyalg RSA -keysize 2048 \
    -validity 10000 -alias viorp
  # android/key.properties (never commit):
  #   storeFile=../viorp-release.jks
  #   storePassword=…
  #   keyAlias=viorp
  #   keyPassword=…
  cd android && ./gradlew bundleRelease   # android/app/build/outputs/bundle/release/app-release.aab
  ```

- New personal developer accounts must run a **closed test with 12 testers for 14 consecutive
  days** before production access.
- Listing assets: phone screenshots (min 2), 1024×500 feature graphic, 512×512 hi-res icon.
- Data safety form must match `/privacy`.

## 5. Apple App Store

- Build with current Xcode against the latest iOS SDK; add `PrivacyInfo.xcprivacy` covering
  camera, photo library, notifications and user-defaults API usage.
- `Info.plist` purpose strings: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`,
  `NSPhotoLibraryAddUsageDescription`, `NSContactsUsageDescription` (contact matching),
  `NSMicrophoneUsageDescription` (live streams and calls).
- **Sign in with Apple is mandatory** on iOS because Google/social login is offered.
- **In-app purchases:** Apple requires StoreKit for digital goods. PEW top-ups therefore must
  either be disabled on the iOS build or routed through StoreKit/RevenueCat. This is an open
  product decision — see `DECISIONS.md`.
- Screenshots: 6.7" (1290×2796) and 6.5"/5.5" as required by the listing.

## 6. Legal / account requirements (both stores)

| Requirement | URL |
|---|---|
| Privacy policy | https://viorp.com/privacy |
| Terms of service | https://viorp.com/terms |
| In-app account deletion | Settings → Delete account (`/settings/delete-account`) |
| External deletion request | https://viorp.com/settings/delete-account, or privacy@viorp.com |

## 7. Desktop (Electron)

The desktop shell lives in `electron/` and loads the same static bundle as the mobile builds.

```bash
npm run electron:build   # CAPACITOR_BUILD=true nuxt generate + cap sync
npm run electron:start   # loads .output/public/index.html
npm run electron:dev     # loads http://localhost:3000 instead
```

`preload.js` exposes only `window.viorpDesktop` (platform flag + `viorp://` deep-link callback);
context isolation and sandbox are on, node integration off, and external links open in the
system browser.

## 8. Listing copy

- **Name:** Viorp
- **Subtitle:** Connect, share and grow
- **Short description:** Social feed, private chat, live streams, gifts and secure P2P trading.
- **Category:** Social Networking
- **Content rating:** 13+
