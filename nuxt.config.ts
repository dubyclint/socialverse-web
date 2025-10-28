// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export default defineNuxtConfig({
  // ✅ Core Configuration
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: true,
  
  // ✅ Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/color-mode',
  ],

  // ✅ Supabase Configuration - Using Environment Variables with Fallbacks
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/auth/login', '/auth/signup', '/']
    }
  },

  // ✅ Runtime Config - For server-side and client-side environment variables
  runtimeConfig: {
    // Private keys - only available server-side
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Public keys - available client-side
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'https://socialverse-web.zeabur.app',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://socialverse-web.zeabur.app/api',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I'
    }
  },

  // ✅ Build Configuration - FIXED: Optimized for production
  build: {
    transpile: ['gun'],
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'supabase': ['@supabase/supabase-js'],
          'socket': ['socket.io-client']
        }
      }
    }
  },

  // ✅ Nitro Configuration (Server)
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml', '/robots.txt']
    },
    // ✅ FIX: Disable prerender for dynamic routes
    routeRules: {
      '/api/**': { cache: false },
      '/auth/**': { cache: false }
    }
  },

  // ✅ App Configuration
  app: {
    head: {
      title: 'SocialVerse - Connect, Share, and Grow Your Network',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse is a modern social networking platform designed to connect people worldwide.' },
        { name: 'theme-color', content: '#1f2937' },
        { name: 'og:title', content: 'SocialVerse' },
        { name: 'og:description', content: 'Connect, Share, and Grow Your Network' },
        { name: 'og:type', content: 'website' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // ✅ CSS Configuration - Only include existing files
  css: [
    '~/assets/css/main.css'
  ],

  // ✅ Vite Configuration - FIXED: Optimized for production
  vite: {
    define: {
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG || false)
    },
    ssr: {
      noExternal: ['gun']
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true
        }
      },
      chunkSizeWarningLimit: 1000
    }
  },

  // ✅ Router Configuration
  router: {
    options: {
      hashMode: false
    }
  },

  // ✅ Experimental Features
  experimental: {
    payloadExtraction: false,
    renderJsonPayload: true
  },

  // ✅ TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: false
  },

  // ✅ Tailwind Configuration
  tailwindcss: {
    exposeConfig: true
  },

  // ✅ Color Mode Configuration
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  }
})

