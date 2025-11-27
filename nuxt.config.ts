// nuxt.config.ts - PRODUCTION-READY WITH ENVIRONMENT VARIABLES
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: true,
  hydration: {
    mismatchHandler: 'silent',
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt'
  ],

  // ============================================================================
  // RUNTIME CONFIG - STRICT SEPARATION OF CLIENT/SERVER VARIABLES
  // ============================================================================
  runtimeConfig: {
    // Server-only (private) - NOT exposed to client
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    
    // Public (client + server) - exposed to both
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '8080',
    },
  },

  // ============================================================================
  // BUILD CONFIGURATION - OPTIMIZE SUPABASE BUNDLING
  // ============================================================================
  build: {
  transpile: ['@supabase/supabase-js'],
},

  // ============================================================================
  // NITRO CONFIGURATION - SERVER-SIDE OPTIMIZATION
  // ============================================================================
  nitro: {
    preset: 'node-server',
    
    // Prerender configuration
    prerender: {
      crawlLinks: false,
      routes: [],
      ignore: ['/**'],
      failOnError: false
    },
    
    // ESBuild optimization
    esbuild: {
      options: {
        target: 'es2022',
        minify: true
      }
    },
    
    // Optimize cold starts
    minify: true,
    sourceMap: false,
    
    // Set port from environment variable
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
  },

  // ============================================================================
  // ALIASES - CLEAN IMPORTS FOR CLIENT/SERVER SEPARATION
  // ============================================================================
  alias: {
    '#supabase/server': '~/server/utils/supabase-server.ts',
    '#supabase/client': '~/composables/use-supabase.ts',
    '#supabase/admin': '~/server/utils/supabase-admin.ts',
  },

  // ============================================================================
  // VITE CONFIGURATION - TREE-SHAKING & OPTIMIZATION
  // ============================================================================
  vite: {
    define: {
      __DEV__: false,
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: true,
      }
    },
  }
})
