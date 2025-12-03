// ============================================================================
// FILE : /nuxt.config.ts - COMPLETE FIXED VERSION
// ============================================================================
// FIXED: Added #utils alias, chunk splitting, and proper build configuration
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
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3ODMyNiwiZXhwIjoyMDc0OTU0MzI2fQ.4gjaVgOV9j_PsVmylhwbqXnTm3zch6LmSsFFG',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
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
  // ✅ FIX: Vite build configuration with chunk splitting
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
        }
      },
      chunkSizeWarningLimit: 1000, // Increase limit to 1000kb
    }
  },

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
    prerender: {
      crawlLinks: true,
      routes: ['/', '/login', '/explore', '/feed'],
      // ✅ CRITICAL FIX: Removed '/api' from ignore list - API routes MUST be compiled!
      ignore: ['/admin', '/manager', '/auth'],
      failOnError: false,
      concurrency: 4,
    },
    esbuild: {
      options: {
        target: 'es2022',
        minify: true,
        sourcemap: false,
        treeShaking: true,
      }
    },
    minify: true,
    sourceMap: false,
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
    logging: {
      level: process.env.LOG_LEVEL === 'debug' ? 'verbose' : 'info',
    },
    // ============================================================================
    // ✅ FIX: Nitro aliases - Use absolute paths from project root
    // ============================================================================
    alias: {
      '#supabase/server': './server/utils/supabase-server.ts',
      '#supabase/client': './composables/use-supabase.ts',
      '#supabase/admin': './server/utils/supabase-admin.ts',
      '#utils': './server/utils',
    },
  },

  // ============================================================================
  // ✅ FIX: Route rules for proper caching
  // ============================================================================
  routeRules: {
    // Cache API responses for 10 minutes
    '/api/**': { cache: { maxAge: 60 * 10 } },
    // Don't cache auth endpoints
    '/api/auth/**': { cache: false },
    // Don't cache translations
    '/api/translations': { cache: false },
    // Don't cache test endpoint
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

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { 
          name: 'description', 
          content: 'SocialVerse - A modern social networking platform' 
        },
        {
          name: 'theme-color',
          content: '#000000'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico'
        }
      ]
    }
  }
})
