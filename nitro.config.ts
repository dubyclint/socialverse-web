export default defineNitroConfig({
  preset: 'node-server',
  srcDir: 'server',
  
  rollupConfig: {
    output: {
      format: 'es',
    },
  },

  externals: {
    inline: [],
    traceInclude: [],
  },

  publicAssets: [
    {
      baseURL: '/',
      dir: './public',
    },
    {
      baseURL: '/_nuxt/',
      dir: './.output/public/_nuxt',
      maxAge: 60 * 60 * 24 * 365,
    },
  ],

  compressPublicAssets: {
    brotli: true,
    gzip: true,
  },

  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },

  routeRules: {
    '/_nuxt/**': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
    },
    '/api/**': {
      cache: false,
    },
    '/health': {
      cache: false,
    },
  },

  logging: {
    level: 'info',
  },

  // =====================================
  // TYPESCRIPT SUPPORT
  // ============================================================================
  typescript: {
    strict: false,
    tsConfig: {
      compilerOptions: {
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
      },
    },
  },
})
