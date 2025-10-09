// nuxt.config.ts
export default defineNuxtConfig({
  // CRITICAL: This ensures Node.js server output instead of serverless
  nitro: {
    preset: 'node-server',
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0'
  },

  // Your existing modules
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],

  // Supabase configuration - HARDCODED VALUES with CORRECT ROUTES
  supabase: {
    url: 'https://cvzrhucbvezqwbesthek.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    redirectOptions: {
      login: '/auth',
      callback: '/auth',
      exclude: ['/']
    }
  },

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Development tools
  devtools: { enabled: true },

  // TypeScript configuration
  typescript: {
    typeCheck: false
  },

  // Build configuration
  build: {
    transpile: ['emoji-js']
  },

  // Runtime config for environment variables - HARDCODED VALUES
  runtimeConfig: {
    // Public keys (exposed to client-side) - REQUIRED for Supabase
    public: {
      supabaseUrl: 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I'
    }
  },

  // App configuration
  app: {
    head: {
      title: 'SocialVerse',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - Connect and Share' }
      ]
    }
  },

  // Server-side rendering configuration
  ssr: true,

  // Experimental features (if needed)
  experimental: {
    payloadExtraction: false
  }
})
