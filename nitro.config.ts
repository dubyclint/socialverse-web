// nitro.config.ts - FINAL VERSION
export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // CRITICAL: Prevent Supabase from being bundled
  // ============================================================================
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
