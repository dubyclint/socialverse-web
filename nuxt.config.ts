// ============================================================================
// FILE: /nuxt.config.ts - COMPLETE FIXED CONFIGURATION
// ============================================================================
// Production-ready Nuxt 3 configuration with:
// - Server-side rendering enabled for reliability
// - Proper middleware support
// - Error handling and hydration configuration
// - Performance optimizations
// - Security best practices
// - SUPABASE MODULE RESOLUTION FIX
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
  // Enables SSR for better reliability and performance
  // If JavaScript fails on client, server can still render pages
  ssr: true,

  // ============================================================================
  // HYDRATION CONFIGURATION
  // ============================================================================
  // Handles mismatches between server and client rendering
  hydration: {
    mismatchHandler: 'silent', // Silently handle hydration mismatches
  },

  // ============================================================================
  // NITRO SERVER CONFIGURATION
  // ============================================================================
  nitro: {
    srcDir: 'server',
    
    // ========================================================================
    // SUPABASE MODULE RESOLUTION FIX - CRITICAL
    // ========================================================================
    // Mark @supabase/supabase-js as external to prevent bundling issues
    externals: {
      inline: [],
      traceInclude: ['@supabase/supabase-js'],
    },
    
    // Mark as external to prevent bundling
    rollupConfig: {
      external: ['@supabase/supabase-js'],
      output: {
        format: 'esm',
      },
    },
    
    // Ensure proper module resolution
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.json'],
    },
    
    // Compression for better performance
    compressPublicAssets: true,
    
    // Cache configuration
    cache: {
      maxAge: 60 * 10, // 10 minutes
    },
    
    // Prerender routes for static generation
    prerender: {
      crawlLinks: false,
      routes: [
        '/',
        '/login',
        '/terms-and-policy',
        '/privacy',
        '/about',
      ],
      ignore: [
        '/admin',
        '/manager',
        '/api',
      ],
    },
    
    // Error handling
    errorHandler: '~/server/utils/error-handler.ts',
    
    // Security headers
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // ============================================================================
  // MODULES
  // ============================================================================
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/color-mode',
  ],

  // ============================================================================
  // FILE-BASED ROUTING
  // ============================================================================
  pages: true,

  // ============================================================================
  // RUNTIME CONFIGURATION
  // ============================================================================
  runtimeConfig: {
    // Server-side only (not exposed to client)
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    databaseUrl: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3ODMyNiwiZXhwIjoyMDc0OTU0MzI2fQ.4gjaVgOV9j_1PsVmylhwbqXnTm3zch6LmS4sFFGeGMg',
    
    // Client-side accessible (prefixed with NUXT_PUBLIC_)
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      cdnEnabled: process.env.NUXT_PUBLIC_CDN_ENABLED === 'true' || false,
    }
  },

  // ============================================================================
  // TAILWIND CSS CONFIGURATION
  // ============================================================================
  tailwindcss: {
    exposeConfig: true,
  },

  // ============================================================================
  // VITE CONFIGURATION - PRODUCTION OPTIMIZATIONS
  // ============================================================================
  vite: {
    define: {
      __DEV__: process.env.NODE_ENV !== 'production',
    },
    
    resolve: {
      alias: {
        // Path alias for Supabase server utilities
        '#supabase/server': '@nuxtjs/supabase/dist/runtime/server'
      }
    },
    
    build: {
      // ====================================================================
      // SOURCE MAP CONFIGURATION
      // ====================================================================
      // Disable source maps in production for security and smaller bundle
      sourcemap: process.env.NODE_ENV !== 'production',
      
      // ====================================================================
      // MINIFICATION SETTINGS
      // ====================================================================
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production',
        },
        format: {
          comments: false,
        },
      },
      
      // ====================================================================
      // ROLLUP OPTIONS
      // ====================================================================
      rollupOptions: {
        output: {
          // Optimize chunk names for better caching
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: '[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      
      // ====================================================================
      // BUILD OPTIMIZATION
      // ====================================================================
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
    },
  },

  // ============================================================================
  // BUILD CONFIGURATION - SUPABASE FIX
  // ============================================================================
  build: {
    transpile: ['@nuxtjs/supabase', '@supabase/supabase-js'],
    analyze: process.env.ANALYZE === 'true',
  },

  // ============================================================================
  // ROUTER CONFIGURATION
  // ============================================================================
  router: {
    options: {
      // Strict mode for route matching
      strict: true,
      // Sensitive mode for case-sensitive routes
      sensitive: false,
    },
  },

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    // Global error boundary
    errorBoundary: true,
    
    // Head configuration
    head: {
      title: 'SocialVerse',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - A modern social networking platform' },
        { name: 'theme-color', content: '#0f172a' },
      ],
      link: [
        { rel: 'icon', href: '/logo.svg' },
      ],
    },
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  experimental: {
    payloadExtraction: false,
    renderJsonPayload: true,
    // Enable better error handling
    asyncEntry: true,
  },

  // ============================================================================
  // TYPESCRIPT CONFIGURATION
  // ============================================================================
  typescript: {
    strict: false,
    typeCheck: false,
  },
})
