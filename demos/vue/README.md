# Vue and Capacitor

Configure this app in `src/services/AuthService.ts` and run it:

```
npm install
npm run serve
```

To see how to configure this app with Okta or Auth0, see [these instructions](https://github.com/oktadev/schematics/#okta-for-ionic).

## iOS

Generate an iOS project with the following command:

```
ionic build
npm i @capacitor/ios
npx cap add ios
```

Add your custom scheme to `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.getcapacitor.capacitor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>dev.localhost.ionic</string>
      <string>com.okta.dev-133337</string>
    </array>
  </dict>
</array>
```

Then, run your project using the Capacitor CLI:

```
npx cap run ios
```

You can also open your project in Xcode and configure code signing.

```
npx cap open ios
```

Then run your app from Xcode.

## Android

Build and add Capacitor for Android with the following commands:

```
ionic build
npm i @capacitor/android
npx cap add android
```

Add your reverse domain name as the `android:scheme` in `android/app/src/main/AndroidManifest.xml` by adding another `<intent-filter>` above the existing one in the `<activity>` element.

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.okta.dev-133337" /> <!-- or dev.localhost.ionic -->
</intent-filter>
```

Then, run your project using the Capacitor CLI:

```
npx cap run android
```

You can also open your project in Android Studio and run your app.

```
npx cap open android
```

See [Ionic's iOS](https://ionicframework.com/docs/developing/ios) and [Android Development](https://ionicframework.com/docs/developing/android) docs for more information.
