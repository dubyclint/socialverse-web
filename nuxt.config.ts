// ============================================================================
// COMPLETE NUXT CONFIG FILE - ALL FIXES MERGED + ALIAS FIX
// ============================================================================
// ✅ FIXED: Added favicon support (Issue 1)
// ✅ FIXED: Added proper static asset handling (Issue 1)
// ✅ FIXED: Added PWA meta tags (Issue 1)
// ✅ FIXED: Enabled CDN and Gun (Issues 6-7)
// ✅ FIXED: Hydration mismatch fixes (Issue 8)
// ✅ FIXED: Added Supabase server alias (CRITICAL FIX)
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
  // ALIAS CONFIGURATION - CRITICAL FIX FOR SERVER-SIDE IMPORTS
  // ============================================================================
  alias: {
    '#supabase/server': './server/utils/supabase-server.ts',
  },

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
      // ✅ FIXED: Enable CDN and Gun (Issues 6-7)
      cdnEnabled: true,
      gunEnabled: true,
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
    // ✅ FIXED: Optimize dependencies
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
      exclude: ['gun', 'gun/gun', 'gun/sea'],
    },
    // ✅ FIXED: Prevent hydration issues (Issue 8)
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
    
    port: 8080,
    host: '0.0.0.0',
    sourceMap: false,
    
    rollupConfig: {
      external: ['gun', 'gun/gun', 'gun/sea'],
    },

    // Add to nuxt.config.ts in the nitro section:

nitro: {
  // ... existing config ...
  
  // ✅ CRITICAL FIX: Add cache control headers
  headers: {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
  
  // ✅ CRITICAL FIX: Disable payload extraction to prevent hydration issues
  payloadExtraction: false,
  
  // ✅ CRITICAL FIX: Proper static asset caching
  publicAssets: [
    {
      baseURL: '/',
      dir: 'public',
      maxAge: 60 * 60 * 24 * 365, // 1 year for versioned assets
    }
  ],
}


    // ✅ FIXED: Proper static asset handling (Issue 1)
    publicAssets: [
      {
        baseURL: '/',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 365, // 1 year cache for static assets
      }
    ],

    compressPublicAssets: true,
    
    // ✅ FIXED: Disable payload extraction to prevent hydration issues (Issue 8)
    payloadExtraction: false,
  },

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
      title: 'SocialVerse - Connect, Share, Grow',
      
      // ✅ FIXED: Complete meta tags (Issue 1)
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
      
      // ✅ FIXED: Complete link tags with all favicon variants (Issue 1)
      link: [
        // Favicon variants
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

      // ✅ FIXED: Disable automatic script injection that causes hydration issues (Issue 8)
      script: [],
    },

    // ✅ FIXED: Page and layout transitions (Issue 8)
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
  // EXPERIMENTAL FEATURES (Issue 8)
  // ============================================================================
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: false,
    // ✅ FIXED: Better async handling
    asyncEntry: true,
    // ✅ FIXED: Better SSR handling
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
  // CSS CONFIGURATION
  // ============================================================================
  css: [],

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

// ============================================================================
// HYDRATION BEST PRACTICES
// ============================================================================
// 
// To avoid hydration mismatches in your components:
//
// 1. Use <ClientOnly> wrapper for client-only components:
//    <ClientOnly>
//      <YourComponent />
//    </ClientOnly>
//
// 2. Use useAsyncData or useFetch with proper keys:
//    const { data } = await useAsyncData('key', () => $fetch('/api/data'))
//
// 3. Use computed properties for reactive data:
//    const count = computed(() => store.count)
//
// 4. Avoid direct DOM manipulation in setup()
//
// ============================================================================
