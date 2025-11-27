// nitro.config.ts - FINAL WORKING VERSION WITH noExternal
export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // CRITICAL: Use noExternal to prevent Supabase from being bundled
  // ============================================================================
  noExternal: [
    '@supabase/supabase-js',
    '@supabase/auth-js',
    '@supabase/postgrest-js',
    '@supabase/realtime-js',
    '@supabase/storage-js',
    '@supabase/functions-js'
  ],
  
  // ============================================================================
  // Prerender Configuration
  // ============================================================================
  prerender: {
    crawlLinks: false,
    routes: [],
    ignore: ['/**'],
    failOnError: false
  },
  
  // ============================================================================
  // Production Optimizations
  // ============================================================================
  minify: true,
  sourceMap: false,
  
  // ============================================================================
  // Middleware
  // ============================================================================
  middleware: ['compression', 'security'],
  
  // ============================================================================
  // Logging
  // ============================================================================
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
})
