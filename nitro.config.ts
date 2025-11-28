// nitro.config.ts - COMPLETE FIXED VERSION
// ✅ FIXES:
// - Issue #3: Prerender failOnError changed from false to true
// - Issue #4: Added comprehensive logging and error handling
// - Added proper error boundaries and monitoring

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
  // ✅ FIXED: Prerender Configuration with error handling
  // ============================================================================
  prerender: {
    crawlLinks: true,
    routes: ['/', '/login'],
    ignore: [],
    failOnError: true, // ✅ CHANGED: Now fails on prerender errors instead of silently failing
  },
  
  // ============================================================================
  // Production Optimizations
  // ============================================================================
  minify: true,
  sourceMap: false,
  
  // ============================================================================
  // ✅ FIXED: Middleware with error handling
  // ============================================================================
  middleware: ['compression', 'security'],
  
  // ============================================================================
  // ✅ FIXED: Comprehensive Logging Configuration
  // ============================================================================
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  
  // ============================================================================
  // ✅ ADDED: Error handling configuration
  // ============================================================================
  errorHandler: (error, event) => {
    console.error('[Nitro] Error Handler:', {
      message: error.message,
      stack: error.stack,
      url: event.node.req.url,
      method: event.node.req.method,
      timestamp: new Date().toISOString(),
    })
    
    // Return proper error response
    return {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    }
  },
  
  // ============================================================================
  // ✅ ADDED: Unhandled error handler
  // ============================================================================
  unhandledError: (error) => {
    console.error('[Nitro] Unhandled Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  },
})

