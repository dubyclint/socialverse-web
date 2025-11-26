// nuxt.config.ts - FINAL WORKING VERSION
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
  build: {
    transpile: [],
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
    prerender: {
      crawlLinks: false,
      routes: [],
      ignore: ['/**'],
      failOnError: false
    },
    esbuild: {
      options: {
        target: 'es2022'
      }
    }
  }
})
