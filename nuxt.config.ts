// ============================================================================
// FILE: /nuxt.config.ts - COMPLETE FIXED & ENHANCED VERSION
// ============================================================================
// ✅ FIXED: Added favicon support
// ✅ FIXED: Added proper static asset handling
// ✅ FIXED: Added PWA meta tags
// ✅ ENHANCED: Better SEO configuration
// ✅ ENHANCED: Optimized build settings
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
  // RUNTIME CONFIG
  // ============================================================================
  runtimeConfig: {
    // Server-only config (private)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    
    // Public config (exposed to client)
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
    // ✅ NEW: Optimize dependencies
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
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

    // ✅ NEW: Proper static asset handling
    publicAssets: [
      {
        baseURL: '/',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 365, // 1 year cache for static assets
      }
    ],

    // ✅ NEW: Compression
    compressPublicAssets: true,
  },

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
      title: 'SocialVerse - Connect, Share, Grow',
      
      // ✅ ENHANCED: Complete meta tags
      meta: [
        { name: 'description', content: 'SocialVerse - A modern social networking platform for connecting, sharing, and growing together.' },
        { name: 'keywords', content: 'social network, community, connect, share, socialverse' },
        { name: 'author', content: 'SocialVerse Team' },
        { name: 'theme-color', content: '#667eea' },
        
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
        
        // PWA
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'SocialVerse' },
      ],
      
      // ✅ ENHANCED: Complete link tags
      link: [
        // Favicon
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        
        // Manifest
        { rel: 'manifest', href: '/manifest.json' },
        
        // Preconnect to external domains
        { rel: 'preconnect', href: 'https://cvzrhucbvezqwbesthek.supabase.co' },
        { rel: 'dns-prefetch', href: 'https://cvzrhucbvezqwbesthek.supabase.co' },
      ],

      // ✅ NEW: Scripts
      script: [
        // Add any analytics or tracking scripts here
        // Example: Google Analytics, etc.
      ],
    },

    // ✅ NEW: Page transitions
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: false,
  },

  // ============================================================================
  // TYPESCRIPT CONFIGURATION
  // ============================================================================
  typescript: {
    strict: false,
    shim: false,
  },

  // ============================================================================
  // CSS CONFIGURATION
  // ============================================================================
  css: [
    // Add global CSS files here if needed
    // '~/assets/css/main.css',
  ],

  // ============================================================================
  // ROUTER CONFIGURATION
  // ============================================================================
  router: {
    options: {
      strict: false,
    },
  },

  // ============================================================================
  // HOOKS (for build-time customization)
  // ============================================================================
  hooks: {
    'build:before': () => {
      console.log('🚀 Building SocialVerse...')
    },
    'build:done': () => {
      console.log('✅ Build complete!')
    },
  },
})
