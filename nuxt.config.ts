
// nuxt.config.ts - HYBRID SUPABASE CONFIGURATION
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
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml', '/robots.txt'],
      ignore: [
        '/admin/**',
        '/api/**',
        '/follows/**',
        '/stream/**',
        '/posts/**',
        '/profile/**',
        '/user/**',
        '/notifications/**',
        '/chat/**',
        '/group-chat/**',
        '/match/**',
        '/wallet-lock/**',
        '/premium/**',
        '/verified/**',
        '/rank/**',
        '/status/**',
        '/presence/**',
        '/universe/**',
        '/support/**',
        '/storage/**',
        '/ads/**',
        '/escrow/**',
        '/pewgift/**',
        '/interests/**'
      ]
    },
    esbuild: {
      options: {
        target: 'es2022'
      }
    }
  }
})
