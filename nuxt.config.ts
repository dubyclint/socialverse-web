// nuxt.config.ts - COMPLETE VERSION WITH SSR DISABLED AND PRERENDER
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: false,
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
      crawlLinks: true,
      routes: ['/'],
      ignore: [],
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
