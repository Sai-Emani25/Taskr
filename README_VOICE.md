# Taskr Voice App

To run this app with Voice capabilities, you cannot use the standard "Expo Go" app because it requires native microphone permissions and speech recognition libraries that are not included by default.

## Option 1: Build APK (Recommended for distribution)

1.  Install EAS CLI:
    ```bash
    npm install -g eas-cli
    ```
2.  Login to your Expo account:
    ```bash
    eas login
    ```
3.  Configure the project:
    ```bash
    eas build:configure
    ```
4.  Build for Android:
    ```bash
    eas build -p android --profile preview
    ```
    (This will give you a download link for the APK).

## Option 2: Run Locally (Requires Android Studio)

1.  Ensure you have Android Studio and Java JDK 17 installed.
2.  Run the prebuild command:
    ```bash
    npx expo prebuild
    ```
3.  Run on connected Android device/emulator:
    ```bash
    npx expo run:android
    ```

## Notes

-   **Wake Word**: Currently, the app uses a manual "Press to Speak" button. The "Keshava" wake word requires an advanced setup with external keys (e.g., Porcupine), which can be added in a future update.
-   **Permissions**: The app will ask for Microphone permission on first use.
