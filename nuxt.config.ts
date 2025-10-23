// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export default defineNuxtConfig({
  // ✅ Core Configuration
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: true,
  
  // ✅ Modules - IMPORTANT: i18n must be configured CORRECTLY here
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    [
      '@nuxtjs/i18n',
      {
        locales: [
          {
            code: 'en-US',
            name: 'English',
            language: 'en',
            file: 'en.json',
          },
          {
            code: 'fr-FR',
            name: 'Français',
            language: 'fr',
            file: 'fr.json',
          },
          {
            code: 'es-ES',
            name: 'Español',
            language: 'es',
            file: 'es.json',
          },
          {
            code: 'de-DE',
            name: 'Deutsch',
            language: 'de',
            file: 'de.json',
          },
        ],
        defaultLocale: 'en-US',
        strategy: 'prefix_except_default',
        langDir: 'locales/',
      },
    ],
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

  // ✅ Nitro Server Configuration
  nitro: {
    preset: 'node-server',
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml', '/robots.txt'],
      ignore: ['/admin', '/api', '/auth'],
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

  // ✅ CSS Configuration - Only include existing files
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

  // ✅ Hooks - Clear cache and generate Supabase types
  hooks: {
    'build:before': async () => {
      try {
        // STEP 1: Clear Nuxt build cache to force fresh configuration
        console.log('🧹 Clearing Nuxt build cache...')
        const cacheDir = path.join(process.cwd(), '.nuxt')
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true })
          console.log('✅ Cache cleared')
        }

        // STEP 2: Generate Supabase types
        console.log('🔄 Generating Supabase types...')
        const projectId = 'cvzrhucbvezqwbesthek'
        
        // Ensure types directory exists
        const typesDir = path.join(process.cwd(), 'types')
        if (!fs.existsSync(typesDir)) {
          fs.mkdirSync(typesDir, { recursive: true })
        }

        // Generate Supabase types
        try {
          execSync(
            `pnpm exec supabase gen types typescript --project-id ${projectId} > types/supabase.ts`,
            { stdio: 'inherit', cwd: process.cwd() }
          )
          console.log('✅ Supabase types generated successfully')
        } catch (error) {
          console.warn('⚠️ Failed to generate Supabase types, continuing with existing types...')
          console.warn('Error:', (error as any).message)
        }
      } catch (error) {
        console.error('❌ Error in build hook:', error)
      }
    },
  },
})
