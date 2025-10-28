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

  // ✅ Supabase Configuration
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/auth/login', '/auth/signup', '/']
    }
  },

  // ✅ Runtime Config
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'https://socialverse-web.zeabur.app',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://socialverse-web.zeabur.app/api',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I'
    }
  },

  // ✅ Build Configuration - SIMPLIFIED
  build: {
    transpile: ['gun']
  },

  // ✅ Nitro Configuration - FIXED: Proper server config
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: [],
      failOnError: false
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
        { name: 'theme-color', content: '#1f2937' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // ✅ CSS Configuration
  css: [
    '~/assets/css/main.css'
  ],

  // ✅ Vite Configuration - SIMPLIFIED
  vite: {
    define: {
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG || false)
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

