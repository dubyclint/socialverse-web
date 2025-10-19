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
  },

  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/auth/register', '/auth/forgot-password'],
    },
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },

  ssr: true,

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/sitemap.xml', '/robots.txt'],
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

  compatibilityDate: '2024-10-19',
});


