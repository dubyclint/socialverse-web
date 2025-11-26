// nuxt.config.ts - FINAL FIX (REMOVE ALL PRERENDER ROUTES)
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
    // Completely disable prerender - no routes, no prerendering
    prerender: {
      crawlLinks: false,
      routes: [],
      ignore: ['/**']
    },
    esbuild: {
      options: {
        target: 'es2022'
      }
    }
  }
})
