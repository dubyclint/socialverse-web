export default defineNuxtConfig({
  ssr: true,
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
    }
  },

  nitro: {
    preset: 'node-server',
    minify: false,
    prerender: { routes: [] }
  }
})
