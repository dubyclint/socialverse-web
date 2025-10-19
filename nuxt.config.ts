// ============================================================================
// nuxt.config.ts - FIXED FOR i18n BUILD ERROR
// ============================================================================
// This configuration fixes the "input.replace is not a function" error
// Place this file at: /nuxt.config.ts

export default defineNuxtConfig({
  // App metadata
  app: {
    head: {
      title: 'SocialVerse - Live Streaming Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Connect, stream, and share with SocialVerse' },
        { name: 'theme-color', content: '#000000' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Nitro server configuration
  nitro: {
    preset: 'node-server',
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    experimental: {
      wasm: true
    },
    plugins: ['~/server/plugins/socket.ts'],
    storage: {
      redis: {
        driver: 'redis',
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      }
    }
  },

  // Modules configuration - ORDER MATTERS!
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'  // i18n MUST be last
  ],

  // i18n v7 Configuration - FIXED
  i18n: {
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en.json'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr.json'
      },
      {
        code: 'es',
        iso: 'es-ES',
        name: 'Español',
        file: 'es.json'
      },
      {
        code: 'de',
        iso: 'de-DE',
        name: 'Deutsch',
        file: 'de.json'
      }
    ],
    defaultLocale: 'en',
    langDir: 'locales/',
    lazy: true,
    // FIXED: Removed problematic detectBrowserLanguage settings
    detectBrowserLanguage: false,
    vueI18n: {
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
      globalInjection: true,
      missingWarn: false,
      fallbackWarn: false,
      // FIXED: Added proper composition
      messages: {}
    }
  },

  // Pinia state management
  pinia: {
    storesDirs: ['./stores/**'],
    autoImports: [
      'defineStore',
      ['defineStore', 'definePiniaStore']
    ]
  },

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    redirectOptions: {
      login: '/auth',
      callback: '/auth',
      exclude: ['/']
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    }
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-side only)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    redisUrl: process.env.REDIS_URL,

    // Public keys (client-side accessible)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
      socketUrl: process.env.SOCKET_URL || 'http://localhost:8080',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      rbacEnabled: process.env.RBAC_ENABLED === 'true',
      defaultUserRole: process.env.DEFAULT_USER_ROLE || 'user',
      adminEmail: process.env.ADMIN_EMAIL,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [],

      // Role-based access control configuration
      rbac: {
        roles: {
          user: {
            permissions: [
              'read:posts',
              'create:posts',
              'update:own_posts',
              'delete:own_posts',
              'read:profile',
              'update:own_profile'
            ],
            routes: ['/feed', '/profile', '/chat', '/explore', '/inbox', '/trade']
          },
          manager: {
            permissions: [
              'read:posts',
              'create:posts',
              'update:posts',
              'delete:posts',
              'read:users',
              'update:users',
              'read:analytics'
            ],
            routes: ['/feed', '/profile', '/chat', '/explore', '/inbox', '/trade', '/manager/*']
          },
          admin: {
            permissions: ['*'],
            routes: ['*']
          }
        },
        defaultRole: 'user',
        adminRoutes: ['/admin/*'],
        managerRoutes: ['/manager/*'],
        protectedRoutes: ['/profile', '/chat', '/inbox', '/trade']
      }
    }
  },

  // CSS configuration
  css: [
    '~/assets/css/main.css',
    '~/assets/css/streaming.css',
    '~/assets/styles/main.css'
  ],

  // Build configuration
  build: {
    transpile: ['chart.js', 'socket.io-client', 'emoji-js']
  },

  // Development tools
  devtools: {
    enabled: true
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        types: ['node', '@nuxt/devtools']
      }
    }
  },

  // Vite configuration
  vite: {
    define: {
      global: 'globalThis'
    },
    optimizeDeps: {
      include: ['socket.io-client', 'chart.js', 'jwt-decode']
    },
    server: {
      hmr: {
        port: 24678
      }
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'socket-io': ['socket.io-client'],
            'chart': ['chart.js']
          }
        }
      }
    }
  },

  // Server-side rendering
  ssr: true,

  // Experimental features
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    serverComponents: true,
    asyncEntry: true
  },

  // Plugins
  plugins: [
    '~/plugins/auth.client.ts',
    '~/plugins/translation.client.js',
    '~/plugins/socket.client.ts',
    '~/plugins/chart.client.ts'
  ],

  // Auto-imports configuration
  imports: {
    dirs: [
      'composables/**',
      'utils/**',
      'composables',
      'composables/auth',
      'composables/rbac'
    ]
  },

  // Components auto-import
  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      path: '~/components/admin',
      prefix: 'Admin',
      pathPrefix: false
    },
    {
      path: '~/components/manager',
      prefix: 'Manager',
      pathPrefix: false
    }
  ],

  // Router configuration with RBAC middleware
  router: {
    middleware: ['auth-check']
  },

  // Tailwind CSS configuration
  tailwindcss: {
    exposeConfig: true,
    viewer: true
  },

  // Color mode configuration
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  }
})
