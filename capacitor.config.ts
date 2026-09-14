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
    // Live reload against `npm run dev` on the LAN:
    //   CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npx cap copy && npx cap run android
    // Never set this for a store build — the shell would load a remote dev server.
    ...(process.env.CAPACITOR_SERVER_URL
      ? { url: process.env.CAPACITOR_SERVER_URL, cleartext: true }
      : {})
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
