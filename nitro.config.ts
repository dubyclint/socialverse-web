// ============================================================================
// FILE: /nitro.config.ts - PRODUCTION CONFIGURATION WITH PROPER ESM SUPPORT
// ============================================================================

export default defineNitroConfig({
  // CRITICAL: Explicitly set preset to node-server for Zeabur compatibility
  preset: 'node-server',

  // ============================================================================
  // SOURCE DIRECTORY
  // ============================================================================
  srcDir: 'server',

  // ============================================================================
  // ESM AND MODULE CONFIGURATION
  // ============================================================================
  // Ensure proper ESM module handling for Supabase
  rollupConfig: {
    output: {
      format: 'es',
    },
  },

  // ============================================================================
  // EXTERNAL MODULES - PREVENT SUPABASE BUNDLING ISSUES
  // ============================================================================
  externals: {
    inline: [],
    traceInclude: [],
  },

  // ============================================================================
  // PUBLIC ASSETS CONFIGURATION
  // ============================================================================
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

  // ============================================================================
  // COMPRESSION CONFIGURATION
  // ============================================================================
  compressPublicAssets: {
    brotli: true,
    gzip: true,
  },

  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },

  // ============================================================================
  // ROUTE RULES - CACHING & MIME TYPES
  // ============================================================================
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

  // ============================================================================
  // LOGGING
  // ============================================================================
  logging: {
    level: 'info',
  },
})
