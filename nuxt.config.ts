// ============================================================================
// FILE: /nuxt.config.ts - PRODUCTION CONFIGURATION
// ============================================================================
// Production-ready Nuxt 3 configuration with explicit Nitro preset
// ============================================================================

export default defineNuxtConfig({
  // ============================================================================
  // CORE CONFIGURATION
  // ============================================================================
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  // ============================================================================
  // SERVER-SIDE RENDERING
  // ============================================================================
  ssr: true,

  // ============================================================================
  // HYDRATION CONFIGURATION
  // ============================================================================
  hydration: {
    mismatchHandler: 'silent',
  },

  // ============================================================================
  // MODULES
  // ============================================================================
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],

  // ============================================================================
  // BUILD CONFIGURATION - TRANSPILE SUPABASE
  // ============================================================================
  build: {
    transpile: ['@supabase/supabase-js'],
  },

  // ============================================================================
  // RUNTIME CONFIG
  // ============================================================================
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
    },
  },

  // ============================================================================
  // NITRO SERVER CONFIGURATION - EXPLICIT PRESET
  // ============================================================================
  nitro: {
    // CRITICAL: Explicitly set preset to prevent Zeabur override
    preset: 'node-server',
    srcDir: 'server',
    
    // ========================================================================
    // EXTERNAL MODULES - PREVENT SUPABASE BUNDLING ISSUES
    // ========================================================================
    externals: {
      inline: [],
      traceInclude: [],
    },
    
    // ========================================================================
    // PUBLIC ASSETS CONFIGURATION
    // ========================================================================
    publicAssets: [
      {
        baseURL: '/',
        dir: './public',
      },
      {
        baseURL: '/_nuxt/',
        dir: './.output/public/_nuxt',
        maxAge: 60 * 60 * 24 * 365,
      },
    ],
    
    // ========================================================================
    // COMPRESSION CONFIGURATION
    // ========================================================================
    compressPublicAssets: {
      brotli: true,
      gzip: true,
    },
    
    // ========================================================================
    // SECURITY HEADERS
    // ========================================================================
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    
    // ========================================================================
    // ROUTE RULES - CACHING & MIME TYPES
    // ========================================================================
    routeRules: {
      '/_nuxt/**': {
        cache: {
          maxAge: 60 * 60 * 24 * 365,
        },
      },
      '/api/**': {
        cache: false,
      },
    },
    
    // ========================================================================
    // LOGGING
    // ========================================================================
    logging: {
      level: 'info',
    },
  },

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    head: {
      title: 'SocialVerse',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - A modern social networking platform' },
      ],
    },
  },

  // ============================================================================
  // COLOR MODE CONFIGURATION
  // ============================================================================
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  // ============================================================================
  // TAILWIND CONFIGURATION
  // ============================================================================
  tailwindcss: {
    exposeConfig: true,
  },
});
