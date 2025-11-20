// ============================================================================
// FILE: /nitro.config.ts
// ============================================================================
// Complete Nitro configuration with MIME type fixes and compression
// ============================================================================

export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // SOURCE DIRECTORY
  // ============================================================================
  srcDir: 'server',
  
  // ============================================================================
  // PUBLIC ASSETS CONFIGURATION - FIX MIME TYPES
  // ============================================================================
  // Serve static assets with correct MIME types
  publicAssets: [
    {
      baseURL: '/',
      dir: './public',
    },
    {
      baseURL: '/_nuxt/',
      dir: './.output/public/_nuxt',
      maxAge: 60 * 60 * 24 * 365, // 1 year for versioned assets
    },
  ],
  
  // ============================================================================
  // COMPRESSION CONFIGURATION - BROTLI + GZIP
  // ============================================================================
  compressPublicAssets: {
    brotli: true,  // Enable Brotli (better compression)
    gzip: true,    // Keep Gzip fallback
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
  // ROUTE RULES - MIME TYPES & CACHE CONTROL
  // ============================================================================
  routeRules: {
    // ========================================================================
    // CSS FILES - CORRECT MIME TYPE
    // ========================================================================
    '/_nuxt/**/*.css': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    // ========================================================================
    // JAVASCRIPT FILES - CORRECT MIME TYPE
    // ========================================================================
    '/_nuxt/**/*.js': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    // ========================================================================
    // SOURCE MAP FILES
    // ========================================================================
    '/_nuxt/**/*.js.map': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    // ========================================================================
    // FONT FILES
    // ========================================================================
    '/_nuxt/**/*.woff2': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'font/woff2',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.woff': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'font/woff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.ttf': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'font/ttf',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    // ========================================================================
    // IMAGE FILES
    // ========================================================================
    '/_nuxt/**/*.png': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.jpg': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.jpeg': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.gif': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.svg': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    '/_nuxt/**/*.webp': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    // ========================================================================
    // API ROUTES - NO CACHE
    // ========================================================================
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
    
    // ========================================================================
    // HTML PAGES - SHORT CACHE
    // ========================================================================
    '/**': {
      cache: {
        maxAge: 60 * 60, // 1 hour
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
    failOnError: false,
  },
  
  // ============================================================================
  // LOGGING
  // ============================================================================
  logging: {
    level: 'info',
  },
})
