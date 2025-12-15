// ============================================================================
// FILE: /nuxt.config.ts - COMPLETE FIXED VERSION
// ============================================================================

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
  ],

  // ============================================================================
  // RUNTIME CONFIG
  // ============================================================================
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://socialverse-web.zeabur.app',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'https://socialverse-web.zeabur.app',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse-web.zeabur.app',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      cdnEnabled: false,
      gunEnabled: false,
      gunPeers: [],
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '8080',
      logLevel: process.env.LOG_LEVEL || 'info',
      appName: 'SocialVerse',
      enablePremium: true,
      enableAnalytics: true,
    },
  },

  // ============================================================================
  // BUILD CONFIGURATION
  // ============================================================================
  build: {
    transpile: [
      '@supabase/supabase-js',
    ],
  },

  // ============================================================================
  // VITE CONFIGURATION
  // ============================================================================
  vite: {
    build: {
      rollupOptions: {
        external: ['gun', 'gun/gun', 'gun/sea'],
      },
    },
  },

  // ============================================================================
  // NITRO CONFIGURATION (Server)
  // ============================================================================
  nitro: {
    preset: 'node-server',
    
    prerender: {
      crawlLinks: false,
      routes: [],
      failOnError: false,
    },
    
    port: 8080,
    host: '0.0.0.0',
    sourceMap: false,
    
    rollupConfig: {
      external: ['gun', 'gun/gun', 'gun/sea'],
    },
  },

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'SocialVerse',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/logo.svg'
        }
      ]
    }
  }
})
