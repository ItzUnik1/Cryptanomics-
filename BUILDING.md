# Building CRYPTANOMICS

## Requirements
- Node.js 22+
- npm
- JDK 21
- Android SDK for local Android Studio builds

## Web
```bash
npm ci
npm run dev
npm run build
```

## Android release APK
The Android project is generated/synchronised by Capacitor. Launcher icon assets are generated from `public/cryptanomics-logo.svg`.

A stable release signing key is required. The private keystore is intentionally not committed to this public repository.

### One-time GitHub signing secret
The repository owner must add an Actions secret named `ANDROID_SIGNING_CONFIG` under:
Settings → Secrets and variables → Actions → New repository secret.

The secret value must be a JSON object with these four fields:

```json
{
  "keystoreBase64": "BASE64_ENCODED_PKCS12_KEYSTORE",
  "storePassword": "KEYSTORE_PASSWORD",
  "keyAlias": "cryptanomics",
  "keyPassword": "KEY_PASSWORD"
}
```

Keep this secret private. Never commit the keystore or its passwords.

### Local debug build
For a local debug APK (not the signed release used by GitHub Releases):

```bash
npm install
npm run android:build
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. It is signed with the local Android debug key and is not suitable for updating the stable signed release installation.

## GitHub Actions
Pushing app changes to `main` starts the Android release workflow. It:
1. Builds the Vite web app.
2. Generates/synchronises the Capacitor Android project.
3. Creates Android launcher icons from the repository SVG.
4. Configures the stable signing key from `ANDROID_SIGNING_CONFIG`.
5. Builds a signed release APK.
6. Uploads the APK artifact and publishes a versioned GitHub Release.

The first installation using the new stable key may require uninstalling an older APK that was signed with the previous temporary CI debug key. Android cannot update an app across different signing certificates. Uninstalling erases local career saves, so preserve any important progress first.
