# Angular and Cordova

Configure this app in `src/environments/environment.ts` and run it:

```
npm install
ionic serve
```

## iOS

Generate an iOS project with the following command:

```
ionic cordova prepare ios
```

Open your project in Xcode, configure code signing, and run your app.

```
open platforms/ios/MyApp.xcworkspace
```

## Android

Generate an Android project with the following command:

```
ionic cordova prepare android
```

Set the launchMode to `singleTask` so the URL does not trigger a new instance of the app in `platforms/android/app/src/main/AndroidManifest.xml`:

```
android:launchMode="singleTask"
```

Open `platforms/android` in Android Studio and run your app.

If you get a Gradle error in Android Studio, go to **File** > **Project Structure** and change the Android Gradle Plugin to `4.0.1`. Kudos to [Stack Overflow](https://stackoverflow.com/a/63206864).
