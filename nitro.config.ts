// nitro.config.ts - COMPLETE FIXED VERSION
export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // CRITICAL: Prevent ALL Supabase packages from being bundled with absolute paths
  // ============================================================================
  rollupConfig: {
    external: [
      '@supabase/supabase-js',
      '@supabase/auth-js',
      '@supabase/postgrest-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js'
    ],
    output: {
      format: 'esm'
    }
  },
  
  // ============================================================================
  // ESBuild Configuration - Also externalize in esbuild
  // ============================================================================
  esbuild: {
    options: {
      target: 'es2022',
      minify: true,
      external: [
        '@supabase/supabase-js',
        '@supabase/auth-js',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@supabase/functions-js'
      ]
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
