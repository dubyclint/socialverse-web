// ============================================================================
// nuxt.config.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXES:
// 1. SSR enabled for proper page rendering
// 2. Prerender configuration for static routes
// 3. Build optimization for Supabase
// 4. Proper output directory configuration
// 5. Transitive dependency handling
// 6. Hydration mismatch handling
// 7. FIXED: Removed Vue from manualChunks (causing build error)
// 8. FIXED: Added tslib to transpile and noExternal
// ============================================================================

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  // ============================================================================
  // ✅ FIX #1: ENABLE SSR for proper page rendering (WAS: ssr: false)
  // ============================================================================
  ssr: true,
  
  // ============================================================================
  // ✅ FIX #2: Hydration mismatch handling
  // ============================================================================
  hydration: {
    mismatchHandler: 'warn',
  },
  
  // ============================================================================
  // ✅ FIX #3: Modules configuration
  // ============================================================================
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt'
  ],

  // ============================================================================
  // ✅ FIX #4: Runtime configuration for environment variables
  // ============================================================================
  runtimeConfig: {
    // Private keys - only available server-side
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    
    // Public keys - available on client and server
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '8080',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://socialverse-web.zeabur.app',
      logLevel: process.env.LOG_LEVEL || 'info',
    },
  },

  // ============================================================================
  // ✅ FIX #5: Build configuration for proper bundling
  // ============================================================================
  build: {
    // Transpile Supabase and other ESM modules
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
  // ✅ FIX #6: Vite configuration for proper code splitting
  // REMOVED manualChunks - Let Nuxt handle chunking automatically
  // ============================================================================
  vite: {
    build: {
      rollupOptions: {
        external: ['gun', 'gun/gun', 'gun/sea']
        // Removed manualChunks entirely - Nuxt handles this automatically
      }
    }
  },

  // ============================================================================
  // ✅ FIX #7: Nitro configuration for proper server rendering
  // ============================================================================
  nitro: {
    preset: 'node-server',
    
    // ✅ FIX #8: Ensure dependencies are bundled correctly
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
    
    // Output directory configuration
    output: {
      dir: '.output',
      publicDir: '.output/public',
      serverDir: '.output/server',
    },
    
    // ✅ FIX #9: Prerender configuration
    prerender: {
      crawlLinks: true,
      routes: ['/', '/login', '/explore', '/feed'],
      ignore: ['/admin', '/manager', '/api', '/auth'],
      failOnError: false,
      concurrency: 4,
    },
    
    // ✅ FIX #10: ESBuild optimization
    esbuild: {
      options: {
        target: 'es2022',
        minify: true,
        sourcemap: false,
        treeShaking: true,
      }
    },
    
    // Minification settings
    minify: true,
    sourceMap: false,
    
    // Server settings
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
    
    // ✅ FIX #11: Logging configuration
    logging: {
      level: process.env.LOG_LEVEL === 'debug' ? 'verbose' : 'info',
    },
  },

  // ============================================================================
  // ✅ FIX #12: Alias configuration for imports
  // ============================================================================
  alias: {
    '#supabase/server': '~/server/utils/supabase-server.ts',
    '#supabase/client': '~/composables/use-supabase.ts',
    '#supabase/admin': '~/server/utils/supabase-admin.ts',
  },

  // ============================================================================
  // ✅ FIX #13: Router configuration
  // ============================================================================
  router: {
    options: {
      strict: false,
      sensitive: false,
    }
  },

  // ============================================================================
  // ✅ FIX #14: App configuration
  // ============================================================================
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


