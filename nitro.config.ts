// nitro.config.ts - CORRECTED
export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // CRITICAL: Prevent Supabase from being bundled - USE ROLLUP EXTERNAL
  // ============================================================================
  rollupConfig: {
    external: ['@supabase/supabase-js'],  // ✅ This is the key
    output: {
      format: 'esm'
    }
  },
  
  // ============================================================================
  // ESBuild Configuration - ALSO externalize
  // ============================================================================
  esbuild: {
    options: {
      target: 'es2022',
      minify: true,
      external: ['@supabase/supabase-js']  // ✅ Also here
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
