// nuxt.config.ts - COMPLETE FIXED VERSION WITH VITE SSR EXTERNAL
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

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '8080',
    },
  },

  build: {
    transpile: [],
  },

  nitro: {
    preset: 'node-server',
    prerender: {
      crawlLinks: false,
      routes: [],
      ignore: ['/**'],
      failOnError: false
    },
    esbuild: {
      options: {
        target: 'es2022',
        minify: true
      }
    },
    minify: true,
    sourceMap: false,
    port: parseInt(process.env.PORT || '8080', 10),
    host: '0.0.0.0',
  },

  alias: {
    '#supabase/server': '~/server/utils/supabase-server.ts',
    '#supabase/client': '~/composables/use-supabase.ts',
    '#supabase/admin': '~/server/utils/supabase-admin.ts',
  },

  vite: {
    define: {
      __DEV__: false,
    },
    ssr: {
      external: [
        '@supabase/supabase-js',
        '@supabase/auth-js',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@supabase/functions-js'
      ]
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: true,
      }
    },
  }
})
