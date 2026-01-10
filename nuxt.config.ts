// ============================================================================
// FILE: /nuxt.config.ts - WITH HARDCODED KEYS AS FALLBACK
// ============================================================================
// ✅ FIXED: Using process.env with hardcoded fallback keys
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
  // ALIAS CONFIGURATION
  // ============================================================================
  alias: {
    '#supabase/server': './server/utils/supabase-server.ts',
  },

  // ============================================================================
  // RUNTIME CONFIG - With hardcoded fallback keys
  // ============================================================================
  runtimeConfig: {
    // Server-only config (private)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3ODMyNiwiZXhwIjoyMDc0OTU0MzI2fQ.4gjaVgOV9j_1PsVmylhwbqXnTm3zch6LmS4sFFGeGMg',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    jwtSecret: process.env.JWT_SECRET || 'o3S7f0UmT9eSf5tWnPt5z2oAz2DWdx73w5TWox+F3YRGzuUKUsExsyFYqJ1TQD31AbW9zCdKOzgI+MAUQkobCQ==',
    MailersendApitoken: process.env.MAILERSEND_API_TOKEN|| '',
    
    // Public config (exposed to client)
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://socialverse-web.zeabur.app',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'https://socialverse-web.zeabur.app',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse-web.zeabur.app',
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
