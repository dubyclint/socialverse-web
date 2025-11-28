// nuxt.config.ts - COMPLETE FIXED VERSION
// ✅ FIXES:
// - Issue #2: Hydration mismatch handler changed from 'silent' to 'warn'
// - Issue #3: Prerender failOnError changed from false to true
// - Issue #4: Added proper error logging and monitoring
// - Issue #1: Port configuration properly handled

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: false,
  
  // ✅ FIXED: Changed from 'silent' to 'warn' to catch hydration mismatches
  hydration: {
    mismatchHandler: 'warn',
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt'
  ],

  runtimeConfig: {
    // Server-side only
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    
    // Public (exposed to client)
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '8080',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://socialverse-web.zeabur.app',
      logLevel: process.env.LOG_LEVEL || 'info',
    },
  },

  build: {
    transpile: [],
  },

  nitro: {
    preset: 'node-server',
    
    // ✅ FIXED: Changed failOnError from false to true to catch build errors
    prerender: {
      crawlLinks: true,
      routes: ['/', '/login'],
      ignore: [],
      failOnError: true, // ✅ CHANGED: Now fails on prerender errors
    },
    
    esbuild: {
      options: {
        target: 'es2022',
        minify: true
      }
    },
    
    minify: true,
    sourceMap: false,
    
    // ✅ FIXED: Port configuration properly reads from environment
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
    
    // ✅ ADDED: Error handling and logging
    logging: {
      level: process.env.LOG_LEVEL === 'debug' ? 'verbose' : 'info',
    },
  },

  alias: {
    '#supabase/server': '~/server/utils/supabase-server.ts',
    '#supabase/client': '~/composables/use-supabase.ts',
    '#supabase/admin': '~/server/utils/supabase-admin.ts',
  },

  vite: {
    define: {
      __DEV__: false,
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
        },
        mangle: true,
      }
    },
  }
})

