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
    // Add WebSocket plugin
    plugins: ['~/server/plugins/socket.ts']
  },

  // Enhanced modules for role-based access control
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@vueuse/nuxt' // Added for enhanced composables
  ],

  // Supabase configuration with role-based security
  supabase: {
    url: 'https://cvzrhucbvezqwbesthek.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
    redirectOptions: {
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

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Development tools
  devtools: { enabled: true },

  // TypeScript configuration
  typescript: {
    typeCheck: false
  },
  
  // Build configuration
  build: {
    transpile: ['emoji-js', 'socket.io-client']
  },

  // Enhanced runtime config for role-based access control
  runtimeConfig: {
    // Private keys (server-side only)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    
    // Public keys (exposed to client-side)
    public: {
      supabaseUrl: 'https://cvzrhucbvezqwbesthek.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDk1NDMyNn0.3k5QE5wTb0E52CqNxwt_HaU9jUGDlYsHWuP7rQVjY4I',
      // Role-based access control configuration
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
            permissions: ['*'], // Full access
            routes: ['*'] // Access to all routes
          }
        },
        defaultRole: 'user',
        adminRoutes: ['/admin/*'],
        managerRoutes: ['/manager/*'],
        protectedRoutes: ['/profile', '/chat', '/inbox', '/trade']
      }
    }
  },

  // Language translation configuration with role-based content
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
    // Role-based translation keys
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
  },
    
  // App configuration with role-based meta
  app: {
    head: {
      title: 'SocialVerse',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SocialVerse - Connect and Share with Role-Based Access Control' }
      ]
    }
  },

  // Server-side rendering configuration
  ssr: true,

  // Enhanced router configuration for role-based routing
  router: {
    middleware: ['auth-check'] // Global middleware for role checking
  },

  // Experimental features
  experimental: {
    payloadExtraction: false,
    // Enable server components for role-based rendering
    serverComponents: true
  },

  // Vite configuration for WebSocket support and role-based modules
  vite: {
    define: {
      global: 'globalThis'
    },
    optimizeDeps: {
      include: ['socket.io-client', 'jwt-decode']
    }
  },

  // Pinia configuration for role-based state management
  pinia: {
    storesDirs: ['./stores/**', './custom-folder/stores/**']
  },

  // Auto-imports for role-based composables
  imports: {
    dirs: [
      'composables',
      'composables/auth',
      'composables/rbac'
    ]
  },

  // Components auto-import with role-based components
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
    {
      path: '~/components/admin',
      prefix: 'Admin',
      pathPrefix: false,
    },
    {
      path: '~/components/manager',
      prefix: 'Manager', 
      pathPrefix: false,
    }
  ]
})

