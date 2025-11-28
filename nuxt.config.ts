// nuxt.config.ts - COMPLETE FIXED VERSION

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: false,
  
  hydration: {
    mismatchHandler: 'warn',
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt'
  ],

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '080',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://socialverse-web.zeabur.app',
      logLevel: process.env.LOG_LEVEL || 'info',
    },
  },

  build: {
    transpile: [],
    // ✅ CRITICAL: Exclude GUN from build
    rollupOptions: {
      external: ['gun', 'gun/gun', 'gun/sea'],
    },
  },

  nitro: {
    preset: 'node-server',
    
    prerender: {
      crawlLinks: true,
      routes: ['/', '/login'],
      ignore: [],
      failOnError: true,
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
    
    logging: {
      level: process.env.LOG_LEVEL === 'debug' ? 'verbose' : 'info',
    },
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
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
        },
        mangle: true,
      }
    },
  }
})
