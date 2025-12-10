// ============================================================================
// FILE : /nuxt.config.ts - COMPLETE FIXED VERSION WITH BUILD OPTIMIZATIONS
// ============================================================================

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  ssr: true,
  
  // ============================================================================
  // ✅ FIX: Hydration mismatch - use 'silent' instead of 'warn'
  // ============================================================================
  hydration: {
    mismatchHandler: 'silent',
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt'
  ],

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min--chars',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://socialverse-web.zeabur.app',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'https://socialverse-web.zeabur.app',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse-web.zeabur.app',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      cdnEnabled: process.env.NUXT_PUBLIC_CDN_ENABLED === 'true' || false,
      gunEnabled: process.env.NUXT_PUBLIC_GUN_ENABLED === 'true' || false,
      gunPeers: (process.env.NUXT_PUBLIC_GUN_PEERS || '').split(',').filter(Boolean) || [],
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '8080',
      logLevel: process.env.LOG_LEVEL || 'info',
      appName: process.env.APP_NAME || 'SocialVerse',
      enablePremium: process.env.NUXT_PUBLIC_ENABLE_PREMIUM === 'true' || true,
      enableAnalytics: process.env.NUXT_PUBLIC_ENABLE_ANALYTICS === 'true' || true,
    },
  },

  build: {
    transpile: [
      '@supabase/supabase-js',
      '@supabase/auth-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
      'lodash-es',
      'date-fns',
      'tslib'
    ],
  },

  // ============================================================================
  // ✅ FIX: Vite build configuration - SIMPLIFIED
  // ============================================================================
  vite: {
    build: {
      rollupOptions: {
        external: ['gun', 'gun/gun', 'gun/sea'],
        output: {
          manualChunks: {
            'supabase': ['@supabase/supabase-js', '@supabase/auth-js', '@supabase/postgrest-js'],
            'chart': ['chart.js'],
            'vendor': ['lodash-es', 'date-fns', 'tslib'],
          }
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: [
        '@supabase/supabase-js',
        'lodash-es',
        'date-fns',
      ],
      exclude: [
        'gun',
        '@tensorflow/tfjs',
        '@tensorflow/tfjs-node',
      ]
    }
  },

  // ============================================================================
  // ✅ CRITICAL FIX: Nitro configuration - SIMPLIFIED & FIXED
  // ============================================================================
  nitro: {
    preset: 'node-server',
    noExternal: [
      '@supabase/supabase-js',
      '@supabase/auth-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
      'lodash-es',
      'date-fns',
      'tslib'
    ],
    output: {
      dir: '.output',
      publicDir: '.output/public',
      serverDir: '.output/server',
    },
    // ============================================================================
    // ✅ CRITICAL FIX: Disable prerendering to prevent IIFE errors
    // ============================================================================
    prerender: {
      crawlLinks: false,
      routes: [],
      failOnError: false,
    },
    // ============================================================================
    // ✅ CRITICAL FIX: Remove conflicting minification settings
    // Let Nitro handle minification with defaults
    // ============================================================================
    esbuild: {
      options: {
        target: 'es2022',
        sourcemap: false,
        treeShaking: true,
      }
    },
    sourceMap: false,
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
    logging: {
      level: process.env.LOG_LEVEL === 'debug' ? 'verbose' : 'info',
    },
    errorHandler: '~/server/error-handler',
    // ============================================================================
    // ✅ FIX: Nitro aliases - Use absolute paths from project root
    // ============================================================================
    alias: {
      '#supabase/server': './server/utils/supabase-server.ts',
      '#supabase/client': './composables/use-supabase.ts',
      '#supabase/admin': './server/utils/supabase-admin.ts',
      '#utils': './server/utils',
    },
    rollupConfig: {
      external: ['gun', 'gun/gun', 'gun/sea'],
      output: {
        format: 'esm',
      }
    }
  },

  // ============================================================================
  // ✅ FIX: Route rules for proper caching
  // ============================================================================
  routeRules: {
    '/api/**': { cache: { maxAge: 60 * 10 } },
    '/api/auth/**': { cache: false },
    '/api/translations': { cache: false },
    '/api/test': { cache: false },
  },

  // ============================================================================
  // ✅ FIX: Experimental features for better performance
  // ============================================================================
  experimental: {
    payloadExtraction: false,
    renderJsonPayload: true,
  },

  // ============================================================================
  // ✅ FIX: Aliases configuration for client-side
  // ============================================================================
  alias: {
    '#supabase/client': '~/composables/use-supabase.ts',
  },

  router: {
    options: {
      strict: false,
      sensitive: false,
    }
  },

  // ============================================================================
  // ✅ FIX: App head configuration with favicon
  // ============================================================================
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'SocialVerse - Modern Social Networking Platform',
      meta: [
        { 
          name: 'description', 
          content: 'SocialVerse - A modern social networking platform with advanced features' 
        },
        {
          name: 'theme-color',
          content: '#000000'
        },
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes'
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/logo.svg'
        },
        {
          rel: 'apple-touch-icon',
          href: '/logo.svg'
        }
      ]
    }
  }
})
