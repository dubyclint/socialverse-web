// ============================================================================
// FILE: /nuxt.config.ts - SECURED PRODUCTION CONFIGURATION FOR NUXT 4
// ============================================================================

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: true,

  future: {
    compatibilityVersion: 4,
  },

  // ============================================================================
  // MODULES & PINIA LAYER AUTO-IMPORTS
  // ============================================================================
  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
  ],

  pinia: {
    storesDirs: ['./stores/**'],
  },

  // ============================================================================
  // ALIAS RESOLUTION
  // ============================================================================
  alias: {
    '~': new URL('./', import.meta.url).pathname,
    '@': new URL('./', import.meta.url).pathname,
  },

  // ============================================================================
  // SUPABASE CONFIGURATION (OPTIMIZED FOR NUXT 4 HYDRATION)
  // ============================================================================
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    redirect: true,
    redirectOptions: {
      login: '/signin',
      callback: '/auth/verify-email',
      exclude: [
        '/',
        '/register',
        '/feed',
        '/stream',
        '/signin',
        '/signup',
        '/auth/forgot-password',
        '/terms-and-policy',
        '/offline.html',
      ],
      cookieRedirect: true,
      saveRedirectToCookie: true,
    },

    cookieOptions: {
      name: 'sb-socialverse-access',
      lifetime: 60 * 60 * 8,
      domain: '',
      path: '/',
      sameSite: 'lax',
    },
  },

  // ============================================================================
  // ROUTE RULES & CACHING (BYPASSING CACHE FOR ALL DYNAMIC AUTH ENTRIES)
  // ============================================================================
  routeRules: {
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/favicon.ico': { headers: { 'Cache-Control': 'public, max-age=86400' } },
    '/manifest.json': { headers: { 'Cache-Control': 'public, max-age=3600' } },
    '/offline.html': { headers: { 'Cache-Control': 'public, max-age=3600' } },
    '/sw.js': { headers: { 'Cache-Control': 'public, max-age=3600' } },
    '/admin/**': { ssr: false },
    
    // Explicitly enforce zero-cache rules across server routes
    '/api/auth/**': { cache: false },
    '/api/profile/**': { cache: false },
    '/api/messages/**': { cache: false },
  },

  // ============================================================================
  // RUNTIME CONFIG (100% SECURED VIA PROCESS.ENV AUTORESOLUTIONS)
  // ============================================================================
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.JWT_SECRET,
    password: process.env.PASSWORD,
    mailersendApiToken: process.env.MAILERSEND_API_TOKEN,

    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://p01--socialverse-web--9dsyp6zx99q5.code.run',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://p01--socialverse-web--9dsyp6zx99q5.code.run',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'https://p01--socialverse-web--9dsyp6zx99q5.code.run',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      enablePremium: true,
      enableAnalytics: true,
    },
  },

  // ============================================================================
  // GLOBAL CSS
  // ============================================================================
  css: [
    '~/assets/css/main.css', 
    'vue-virtual-scroller/dist/vue-virtual-scroller.css'
  ],
  
  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  // ============================================================================
  // APP HEAD & ROUTING (REMOVED TRANSITIONS TO PREVENT HYDRATION DOUBLE-TIMING)
  // ============================================================================
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',

    head: {
      title: 'SocialVerse - Connect, Share, and Grow',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        },
        {
          name: 'description',
          content: 'Next-Generation Social Commerce Network - Connect with friends, share moments, and grow your social network.',
        },
        { name: 'theme-color', content: '#667eea' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'SocialVerse' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
      ],
      script: [
        {
          src: '/register-sw.js',
          async: true,
          defer: true,
        },
      ],
    },
    // Deactivated transitions to prevent collision with automated auth redirects
    pageTransition: false,
    layoutTransition: false,
  },

  // ============================================================================
  // VITE - OPTIMIZED WITH SAFE CHUNK ALLOCATION
  // ============================================================================
  vite: {
    optimizeDeps: {
      include: ['@nuxtjs/supabase', 'vue', 'pinia', '@headlessui/vue'],
    },
    build: {
      minify: 'esbuild',
      sourcemap: 'hidden',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }

            if (id.includes('/stores/')) {
              const match = id.match(/stores\/([^/]+)\.(ts|js)/)
              if (match) {
                return `store-${match[1]}`
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    asyncEntry: true,
  },

  // ============================================================================
  // TYPESCRIPT
  // ============================================================================
  typescript: {
    strict: true,
    shim: false,
  },

  // ============================================================================
  // BUILD HOOKS
  // ============================================================================
  hooks: {
    'build:before': () => {
      console.log('🚀 Compiling Protected SocialVerse Production Build Pipeline...')
    },
  },

  // ============================================================================
  // NITRO SERVER CONFIGURATION
  // ============================================================================
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/sitemap.xml', '/robots.txt', '/offline.html'],
      ignore: ['/admin'],
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },

  // ============================================================================
  // PLUGIN INITIALIZATION ORDER
  // ============================================================================
  plugins: [
    '~/plugins/01-init-app.client.ts',
  ],
})
