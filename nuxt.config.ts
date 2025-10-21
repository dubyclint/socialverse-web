export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      {
        code: 'en-US',
        name: 'English',
        language: 'en',
      },
      {
        code: 'fr-FR',
        name: 'Français',
        language: 'fr',
      },
      {
        code: 'es-ES',
        name: 'Español',
        language: 'es',
      },
      {
        code: 'de-DE',
        name: 'Deutsch',
        language: 'de',
      },
    ],
    defaultLocale: 'en-US',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/auth/register', '/auth/forgot-password'],
    },
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse.app',
    },
  },

  ssr: true,

  nitro: {
    prerender: {
      crawlLinks: false,
      routes: [],
      ignore: ['/admin', '/api', '/sitemap.xml', '/robots.txt'],
    },
  },

  app: {
    head: {
      title: 'SocialVerse',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - Connect, Share, Explore' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia'],
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },

  compatibilityDate: '2024-10-19',
})
