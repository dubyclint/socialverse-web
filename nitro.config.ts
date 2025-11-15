// ============================================================================
// UPDATED: /nitro.config.ts - WITH BROTLI COMPRESSION
// ============================================================================

export default defineNitroConfig({
  preset: 'node-server',
  
  // ✅ Explicitly include server directory
  srcDir: 'server',
  
  // ============================================================================
  // COMPRESSION CONFIGURATION - BROTLI + GZIP
  // ============================================================================
  // Enable both Brotli and Gzip compression for maximum compatibility
  // Brotli provides better compression (10-20% better than gzip)
  // Gzip is fallback for older browsers
  
  compressPublicAssets: {
    // Enable compression for public assets
    brotli: true,  // ✅ Enable Brotli (better compression)
    gzip: true,    // ✅ Keep Gzip (fallback)
  },
  
  // ============================================================================
  // CACHE CONFIGURATION
  // ============================================================================
  routeRules: {
    // API routes - no cache
    '/api/**': { 
      cache: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
    
    // Auth routes - no cache
    '/auth/**': { 
      cache: false,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
    
    // Static assets - long cache
    '/_nuxt/**': {
      cache: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
      },
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    
    // Images - long cache
    '/images/**': {
      cache: {
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
      headers: {
        'Cache-Control': 'public, max-age=2592000',
      },
    },
    
    // HTML pages - short cache
    '/**': {
      cache: {
        maxAge: 60 * 60, // 1 hour
      },
      headers: {
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
  // SECURITY HEADERS
  // ============================================================================
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
})
