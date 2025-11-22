export default defineNitroConfig({
  preset: 'node-server',
  srcDir: 'server',
  
  rollupConfig: {
    output: {
      format: 'es',
    },
  },

  externals: {
    inline: ['@supabase/supabase-js'],
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
  },

  logging: {
    level: 'info',
  },
})

