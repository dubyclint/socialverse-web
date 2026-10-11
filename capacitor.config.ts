import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'com.viorp.app',
  appName: 'Viorp',
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
    hostname: process.env.CAPACITOR_HOSTNAME || 'viorp.com',
    // The app shell loads the live site so every web deploy reaches installed
    // apps without a store release; the bundled copy in webDir is only shown
    // via errorPath when the device is offline. Set CAPACITOR_BUNDLED=1 to ship
    // the bundled SPA instead, or CAPACITOR_SERVER_URL for LAN live reload.
    ...(process.env.CAPACITOR_BUNDLED === '1'
      ? {}
      : {
          url: process.env.CAPACITOR_SERVER_URL || `https://${process.env.CAPACITOR_HOSTNAME || 'viorp.com'}`,
          cleartext: Boolean(process.env.CAPACITOR_SERVER_URL?.startsWith('http:')),
          errorPath: 'offline.html'
        })
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0A0F1E',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0F1E'
    }
  }
}

export default config
