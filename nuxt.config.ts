// nuxt.config.ts - FINAL COMPLETE FIX
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
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],
  build: {
    transpile: ['@supabase/supabase-js'],
  },
  runtimeConfig: {
    // Server-only (private)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    
    // Public (client + server)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
    },
  },
  alias: {
    '#supabase/server': '~/server/utils/supabase-server.ts',
    '#supabase/client': '~/composables/use-supabase.ts'
  },
  nitro: {
    // Disable prerender completely - your app is fully dynamic
    prerender: false,
    esbuild: {
      options: {
        target: 'es2022'
      }
    }
  }
})
