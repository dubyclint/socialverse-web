// ============================================================================
// FILE: /nuxt.config.ts - COMPLETE FIXED CONFIGURATION
// ============================================================================
// Production-ready Nuxt 3 configuration with proper Supabase handling
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
  // NITRO SERVER CONFIGURATION
  // ============================================================================
  nitro: {
    srcDir: 'server',
    prerender: {
      crawlLinks: false,
      routes: ['/', '/login', '/terms-and-policy', '/privacy', '/about'],
      ignore: ['/admin', '/manager', '/api'],
    },
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
    // Server-side only
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    databaseUrl: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3ODMyNiwiZXhwIjoyMDc0OTU0MzI2fQ.4gjaVgOV9j_1PsVmylhwbqXnTm3zch6LmS4sFFGeGMg',
    
    // Client-side accessible
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
        '#supabase/server': '@nuxtjs/supabase/dist/runtime/server'
      }
    },
    
    build: {
      sourcemap: process.env.NODE_ENV !== 'production',
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
      rollupOptions: {
        output: {
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: '[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
    },
  },

  // ============================================================================
  // BUILD CONFIGURATION - CRITICAL SUPABASE FIX
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
      strict: true,
      sensitive: false,
    },
  },

  // ============================================================================
  // APP CONFIGURATION
  // ============================================================================
  app: {
    errorBoundary: true,
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

