// FILE: /nuxt.config.ts
// ✅ FIXED - @nuxtjs/supabase module re-enabled
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
    '@nuxtjs/supabase',  // ✅ RE-ENABLED - This was the issue!
    '@nuxtjs/color-mode',
  ],

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
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse-web.zeabur.app',
      apiBase: process.env.API_BASE || 'https://socialverse-web.zeabur.app',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'https://socialverse-web.zeabur.app',
    },
  },

  build: {
    transpile: ['@supabase/supabase-js'],
  },

  vite: {
    build: {
      cssCodeSplit: false,
      minify: 'terser',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
  },

  app: {
    head: {
      title: 'SocialVerse - Connect, Share, Grow',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - A modern social networking platform' },
      ],
    },
  },
})
