// ============================================================================
// FILE: /nuxt.config.ts - FIXED VERSION
// ============================================================================
// ✅ FIXED: Removed hardcoded keys, added missing comma after runtimeConfig
// ============================================================================

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: true,

  // ============================================================================
  // MODULES
  // ============================================================================
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
  ],

  // ============================================================================
  // ALIAS CONFIGURATION - CRITICAL FIX FOR SERVER-SIDE IMPORTS
  // ============================================================================
  alias: {
    '#supabase/server': './server/utils/supabase-server.ts',
  },

  // ============================================================================
  // RUNTIME CONFIG - ✅ FIXED: No hardcoded keys, reads from env vars
  // ============================================================================
  runtimeConfig: {
    // Server-only config (private)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    jwtSecret: process.env.JWT_SECRET,
    brevoApiKey: process.env.BREVO_API_KEY,
    
    // Public config (exposed to client)
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY,
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      cdnEnabled: true,
      gunEnabled: true,
      gunPeers: [],
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '3000',
      logLevel: process.env.LOG_LEVEL || 'info',
      appName: 'SocialVerse',
      enablePremium: true,
      enableAnalytics: true,
    },
  }, // ✅ FIXED: Added missing comma here

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
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
      exclude: ['gun', 'gun/gun', 'gun/sea'],
    },
    ssr: {
      noExternal: ['@supabase/supabase-js'],
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
    
    port: 3000,
    host: '0.0.0.0',
    sourceMap: false,
    
    rollupConfig: {
      external: ['gun', 'gun/gun', 'gun/sea'],
    },

    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
    
    payloadExtraction: false,
    
    publicAssets: [
      {
        baseURL: '/',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 365,
      }
    ],

    compressPublicAssets: true,
  },

  // ============================================================================
  // CSS CONFIGURATION
  // ============================================================================
  css: [
    '~/assets/css/app.css',
  ],

  // ============================================================================
  // PLUGIN CONFIGURATION
  // ============================================================================
  plugins: [
    // Auto-loaded from ~/plugins/*.ts
  ],

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover',
      title: 'SocialVerse - Connect, Share, Grow',
      
      meta: [
        { name: 'description', content: 'SocialVerse - A modern social networking platform for connecting, sharing, and growing together.' },
        { name: 'keywords', content: 'social network, community, connect, share, socialverse' },
        { name: 'author', content: 'SocialVerse Team' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'SocialVerse' },
        
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://socialverse-web.zeabur.app' },
        { property: 'og:title', content: 'SocialVerse - Connect, Share, Grow' },
        { property: 'og:description', content: 'A modern social networking platform for connecting, sharing, and growing together.' },
        { property: 'og:image', content: 'https://socialverse-web.zeabur.app/og-image.png' },
        
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://socialverse-web.zeabur.app' },
        { name: 'twitter:title', content: 'SocialVerse - Connect, Share, Grow' },
        { name: 'twitter:description', content: 'A modern social networking platform for connecting, sharing, and growing together.' },
        { name: 'twitter:image', content: 'https://socialverse-web.zeabur.app/og-image.png' },
      ],
      
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        
        { rel: 'manifest', href: '/manifest.json' },
        
        { rel: 'preconnect', href: 'https://cvzrhucbvezqwbesthek.supabase.co' },
        { rel: 'dns-prefetch', href: 'https://cvzrhucbvezqwbesthek.supabase.co' },
      ],

      script: [],
    },

    pageTransition: { 
      name: 'page', 
      mode: 'out-in',
      duration: 300,
    },
    layoutTransition: { 
      name: 'layout', 
      mode: 'out-in',
      duration: 300,
    },
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: false,
    asyncEntry: true,
    noScripts: false,
  },

  // ============================================================================
  // TYPESCRIPT CONFIGURATION
  // ============================================================================
  typescript: {
    strict: false,
    shim: false,
  },

  // ============================================================================
  // ROUTER CONFIGURATION
  // ============================================================================
  router: {
    options: {
      strict: false,
    },
  },

  // ============================================================================
  // HOOKS
  // ============================================================================
  hooks: {
    'build:before': () => {
      console.log('🚀 Building SocialVerse...')
    },
  },
})
