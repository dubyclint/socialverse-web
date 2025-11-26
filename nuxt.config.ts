// nuxt.config.ts - PRODUCTION-READY WITH MIDDLEWARE & OPTIMIZATION
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
    },
  },

  // ============================================================================
  // BUILD CONFIGURATION - OPTIMIZE SUPABASE BUNDLING
  // ============================================================================
  build: {
    transpile: [],
    rollupConfig: {
      output: {
        manualChunks: {
          // Separate Supabase into its own chunk for better caching
          'supabase': ['@supabase/supabase-js'],
          // Separate heavy dependencies
          'socket': ['socket.io-client'],
          'chart': ['chart.js', 'vue-chartjs'],
        }
      }
    }
  },

  // ============================================================================
  // NITRO CONFIGURATION - SERVER-SIDE OPTIMIZATION WITH MIDDLEWARE
  // ============================================================================
  nitro: {
    // Prevent Supabase from being bundled into server
    rollupConfig: {
      external: ['@supabase/supabase-js'],
      output: {
        globals: {
          '@supabase/supabase-js': 'supabase'
        }
      }
    },
    
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
    
    // Production middleware
    middleware: ['compression', 'helmet'],
  },

  // ============================================================================
  // ALIASES - CLEAN IMPORTS FOR CLIENT/SERVER SEPARATION
  // ============================================================================
  alias: {
    '#supabase/server': '~/server/utils/supabase-server.ts',
    '#supabase/client': '~/composables/use-supabase.ts',
    '#supabase/admin': '~/server/utils/supabase-admin.ts',
    '#middleware': '~/server/middleware',
    '#utils': '~/server/utils',
  },

  // ============================================================================
  // VITE CONFIGURATION - TREE-SHAKING & OPTIMIZATION
  // ============================================================================
  vite: {
    define: {
      __DEV__: false,
    },
    build: {
      // Enable tree-shaking
      rollupOptions: {
        output: {
          manualChunks: {
            'supabase': ['@supabase/supabase-js'],
          }
        }
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: true,
      }
    },
    ssr: {
      external: ['@supabase/supabase-js'],
      noExternal: []
    }
  }
})
