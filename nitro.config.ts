// nitro.config.ts - PRODUCTION-READY WITH SUPABASE EXTERNALIZATION
// ============================================================================
// CRITICAL FIX: Externalize Supabase to prevent ESM bundling issues
// ============================================================================

export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // CRITICAL: Externalize @supabase/supabase-js
  // ============================================================================
  // This tells esbuild to NOT bundle Supabase, but load it from node_modules
  // at runtime. This prevents ESM resolution errors with internal imports.
  rollupConfig: {
    external: ['@supabase/supabase-js'],
    output: {
      format: 'esm'
    }
  },
  
  // ============================================================================
  // ESBuild Configuration
  // ============================================================================
  esbuild: {
    options: {
      target: 'es2022',
      minify: true,
      // Don't try to bundle Supabase
      external: ['@supabase/supabase-js']
    }
  },
  
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
