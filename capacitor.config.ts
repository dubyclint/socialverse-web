import type { CapacitorConfig } from '@capacitor/cli'

// NOTE: appId (Android applicationId / iOS bundle identifier) and the server
// hostname are provisional placeholders pending the production domain and store
// listing decision. Change both before the first store submission — the appId
// cannot be changed after a listing is published.
const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'com.socialverse.app',
  appName: 'SocialVerse',
  webDir: '.output/public',
  android: {
    allowMixedContent: false
  },
  ios: {
    contentInset: 'always'
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // API + realtime calls go to the deployed backend; the shell only bundles the SPA.
    hostname: process.env.CAPACITOR_HOSTNAME || 'localhost'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: false
    }
  }
}

export default config
