# Building CRYPTANOMICS

This guide covers local web builds, Android builds and the automated release workflow.

## Requirements

- Node.js 22 or newer
- npm
- JDK 21
- Android SDK / Android Studio for local device or emulator deployment

## Install dependencies

```bash
npm install
```

## Web build

```bash
npm run build
```

Vite writes the production bundle to `dist/`.

## Android build

The `android/` directory is the Capacitor native project. Keep its Gradle wrapper and project configuration in version control. Do not commit generated Gradle caches, local SDK paths, or build output.

```bash
npx cap sync android
cd android
./gradlew assembleDebug
```

APK output:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

On Windows, run `gradlew.bat assembleDebug` from the `android` directory.

## GitHub Actions

The workflow at `.github/workflows/android-apk.yml`:

1. Checks out the repository.
2. Installs Node dependencies.
3. Builds the Vite web application.
4. Synchronises the Capacitor Android project.
5. Builds the Android debug APK with Gradle.
6. Uploads the APK as a workflow artifact.
7. Publishes the APK to GitHub Releases using the version in `package.json`.

It can run automatically after relevant pushes to `main` or manually through the Actions tab.

## Preparing a release

1. Update `version` in `package.json`.
2. Update `APP_VERSION` in `src/main.js` to the same version.
3. Commit and push to `main`.
4. Wait for the Android workflow to complete successfully.
5. Verify the APK in the workflow artifacts and GitHub Releases.

The workflow uses the package version to create the release tag, for example `0.2.2` becomes `v0.2.2`. Do not reuse an existing release version.
