// FIXED: /nuxt.config.ts
// ============================================================================

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: false,
  
  nitro: {
    srcDir: 'server',
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/color-mode',
  ],

  // ============================================================================
  // ROUTER CONFIGURATION - FIXED
  // ============================================================================
  // REMOVED: router.options.history configuration
  // Nuxt 3 handles history mode automatically
  // NO NEED to manually configure history mode
  
  // If you need custom scroll behavior, use a plugin instead:
  // See: /plugins/router-scroll.client.ts (to be created)

  // ============================================================================
  // ENABLE FILE-BASED ROUTING
  // ============================================================================
  pages: true,

  // ============================================================================
  // RUNTIME CONFIG
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
    }
  },

  // ============================================================================
  // TAILWIND CSS CONFIGURATION
  // ============================================================================
  tailwindcss: {
    exposeConfig: true,
  },

  // ============================================================================
  // VITE CONFIGURATION
  // ============================================================================
  vite: {
    define: {
      __DEV__: true,
    },
  },

  // ============================================================================
  // BUILD CONFIGURATION
  // ============================================================================
  build: {
    transpile: ['@nuxtjs/supabase'],
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  experimental: {
    payloadExtraction: false,
    renderJsonPayload: true,
  },
})
