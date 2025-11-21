// ============================================================================
// FILE: /nitro.config.ts - COMPLETE FIXED CONFIGURATION
// ============================================================================
// Nitro configuration with explicit node-server preset
// ============================================================================

export default defineNitroConfig({
  // CRITICAL: Explicitly set preset to node-server
  preset: 'node-server',
  
  // ============================================================================
  // SOURCE DIRECTORY
  // ============================================================================
  srcDir: 'server',
  
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
    '/_nuxt/**/*.css': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.js': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.js.map': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.woff2': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'font/woff2',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.woff': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'font/woff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.ttf': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'font/ttf',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.png': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.jpg': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.jpeg': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.gif': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.svg': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**/*.webp': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/api/**': {
      cache: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    },
    '/auth/**': {
      cache: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    },
    '/**': {
      cache: {
        maxAge: 60 * 60,
      },
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  },
  
  // ============================================================================
  // PRERENDER CONFIGURATION
  // ============================================================================
  prerender: {
    crawlLinks: false,
    routes: ['/sitemap.xml', '/robots.txt'],
    ignore: ['/admin', '/api', '/auth'],
  },
})
