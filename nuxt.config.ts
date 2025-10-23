// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export default defineNuxtConfig({
  // ✅ Core Configuration - DYNAMIC SSR MODE
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: true,
  
  // ✅ Modules - REMOVED @nuxtjs/i18n to use custom API
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/color-mode',
  ],

  // ✅ Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'],
    },
  },

  // ✅ Runtime Configuration
  runtimeConfig: {
    // Private keys - only accessible server-side
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    databaseUrl: process.env.DATABASE_URL || '',
    emailServiceKey: process.env.EMAIL_SERVICE_KEY || '',
    
    // Public keys - accessible client-side
    public: {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      apiBase: process.env.API_BASE || 'http://localhost:3000',
    },
  },

  // ✅ Nitro Server Configuration - DYNAMIC SSR (NOT STATIC)
  nitro: {
    preset: 'node-server',
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml', '/robots.txt'],
      ignore: ['/admin', '/api', '/auth'],
      failOnError: false,  // ✅ ADDED: Don't fail build if prerender errors occur
    },
    storage: {
      redis: {
        driver: 'redis',
        connectionString: process.env.REDIS_URL,
      },
    },
  },

  // ✅ Build Configuration
  build: {
    transpile: ['@vueuse/nuxt'],
  },

  // ✅ CSS Configuration
  css: [
    '~/assets/css/main.css',
  ],

  // ✅ App Configuration
  app: {
    head: {
      title: 'SocialVerse - Connect, Share, Grow',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - A modern social networking platform' },
        { name: 'theme-color', content: '#2563eb' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  // ✅ Tailwind CSS Configuration
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
    config: {
      theme: {
        extend: {
          colors: {
            primary: '#2563eb',
            secondary: '#7c3aed',
          },
        },
      },
    },
  },

  // ✅ Color Mode Configuration
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  // ✅ Experimental Features
  experimental: {
    payloadExtraction: false,
    renderJsonPayload: true,
  },

  // ✅ TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // ✅ Vite Configuration
  vite: {
    define: {
      __DEV__: process.env.NODE_ENV !== 'production',
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', '@pinia/nuxt'],
    },
  },

  // ✅ Hooks - Clear cache
  hooks: {
    'build:before': async () => {
      try {
        console.log('🧹 Clearing Nuxt build cache...')
        const cacheDir = path.join(process.cwd(), '.nuxt')
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true })
        }
        console.log('✅ Cache cleared')

        console.log('🔄 Generating Supabase types...')
        try {
          execSync('pnpm exec supabase gen types typescript --project-id cvzrhucbvezqwbesthek > types/supabase.ts', {
            stdio: 'inherit',
          })
          console.log('✅ Supabase types generated')
        } catch (error) {
          console.warn('⚠️ Failed to generate Supabase types, continuing with existing types...')
        }
      } catch (error) {
        console.error('❌ Build hook error:', error)
      }
    },
  },
})
