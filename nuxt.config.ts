// nuxt.config.ts
export default defineNuxtConfig({
  // CRITICAL: Node.js server output for Socket.io
  nitro: {
    preset: 'node-server',
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    experimental: {
      wasm: true
    },
    plugins: ['~/server/plugins/socket.ts']
  },

  // Modules
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],

  // CSS Framework
  css: [
    '~/assets/css/main.css'
  ],

  // Runtime Config
  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.JWT_SECRET,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    
    // Public keys (exposed to client-side)
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:8080',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      maxFileSize: process.env.MAX_FILE_SIZE || '50MB'
    }
  },

  // App Configuration
  app: {
    head: {
      title: 'SocialVerse - Private Social Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Private social platform with secure messaging' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Build Configuration
  build: {
    transpile: ['socket.io-client']
  },

  // Vite Configuration
  vite: {
    define: {
      global: 'globalThis'
    },
    optimizeDeps: {
      include: ['socket.io-client']
    }
  },

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },

  // Development Configuration
  devtools: { enabled: true },
  
  // TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: true
  }
})
// nuxt.config.ts
export default defineNuxtConfig({
  // CRITICAL: This ensures Node.js server output instead of serverless
  nitro: {
    preset: 'node-server',
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    // Enable WebSocket support
    experimental: {
      wasm: true
    },
    // Enable WebSocket handling
    plugins: ['~/server/plugins/socket.ts']
  },

  // Enhanced modules (merged from both files)
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@vueuse/nuxt'
  ],

  // Pinia configuration (merged)
  pinia: {
    storesDirs: ['./stores/**', './custom-folder/stores/**'],
    autoImports: [
      'defineStore',
      ['defineStore', 'definePiniaStore']
    ]
  },

  // Supabase configuration (merged with environment fallbacks)
  supabase: {
    // Prefer env vars, fallback to hardcoded values from second file
    url: process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    redirectOptions: {
      // Prefer second file's simpler auth routes (more consistent with RBAC)
      login: '/auth',
      callback: '/auth',
      exclude: ['/']
    },
    // Enhanced client options for role-based access
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    }
  },

  // Runtime configuration (fully merged)
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

    // Public keys (client-side)
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

      // Role-based access control configuration (from second file)
      rbac: {
        roles: {
          user: {
            permissions: ['read:posts', 'create:posts', 'update:own_posts', 'delete:own_posts', 'read:profile', 'update:own_profile'],
            routes: ['/feed', '/profile', '/chat', '/explore', '/inbox', '/trade']
          },
          manager: {
            permissions: ['read:posts', 'create:posts', 'update:posts', 'delete:posts', 'read:users', 'update:users', 'read:analytics'],
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

  // CSS configuration (merged all paths)
  css: [
    '~/assets/css/main.css',
    '~/assets/css/streaming.css',
    '~/assets/styles/main.css'
  ],

  // Build configuration (merged transpile list)
  build: {
    transpile: ['chart.js', 'socket.io-client', 'emoji-js']
  },

  // App configuration (title and description from first file preserved)
  app: {
    head: {
      title: 'SocialVerse - Live Streaming Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Connect, stream, and share with SocialVerse' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Development tools
  devtools: { enabled: true },

  // TypeScript configuration (strict from first, typeCheck from second)
  typescript: {
    strict: true,
    typeCheck: false
  },

  // Vite configuration (merged)
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
    }
  },

  // Server-side rendering
  ssr: true,

  // Experimental features (merged)
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    serverComponents: true
  },

  // Plugins (merged)
  plugins: [
    '~/plugins/socket.client.ts',
    '~/plugins/chart.client.ts'
  ],

  // Auto-imports (merged all directories)
  imports: {
    dirs: [
      'composables/**',
      'utils/**',
      'composables',
      'composables/auth',
      'composables/rbac'
    ]
  },

  // Components auto-import (merged with role-based prefixes)
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

  // Enhanced router for RBAC
  router: {
    middleware: ['auth-check']
  },

  // i18n configuration (from second file)
  i18n: {
    locales: [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'de', name: 'German' }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    vueI18n: {
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          roles: {
            user: 'User',
            manager: 'Manager',
            admin: 'Administrator'
          },
          permissions: {
            denied: 'Access denied. Insufficient permissions.',
            required: 'Authentication required.',
            admin_only: 'Admin access only.',
            manager_only: 'Manager access only.'
          }
        }
      }
    }
  }
})
