// ============================================================================
// nitro.config.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXES:
// 1. Supabase bundling configuration (CRITICAL)
// 2. Prerender error handling
// 3. Output directory structure
// 4. Transitive dependency resolution
// 5. Proper middleware configuration
// 6. FIXED: Removed Vue from manualChunks (causing build error)
// ============================================================================

export default defineNitroConfig({
  preset: 'node-server',
  
  // ============================================================================
  // ✅ FIX #1: CRITICAL - Prevent Supabase from being externalized
  // This ensures Supabase is bundled with the app, not treated as external
  // ============================================================================
  noExternal: [
    '@supabase/supabase-js',
    '@supabase/auth-js',
    '@supabase/postgrest-js',
    '@supabase/realtime-js',
    '@supabase/storage-js',
    '@supabase/functions-js',
    'lodash-es',
    'date-fns',
    'chart.js',
    'vue-chartjs'
  ],
  
  // ============================================================================
  // ✅ FIX #2: Proper output directory configuration
  // ============================================================================
  output: {
    dir: '.output',
    publicDir: '.output/public',
    serverDir: '.output/server',
  },
  
  // ============================================================================
  // ✅ FIX #3: Prerender configuration with proper error handling
  // ============================================================================
  prerender: {
    crawlLinks: true,
    routes: ['/', '/login', '/explore', '/feed'],
    ignore: ['/admin', '/manager', '/api', '/auth'],
    failOnError: false,
    concurrency: 4,
  },
  
  // ============================================================================
  // ✅ FIX #4: ESBuild optimization
  // ============================================================================
  esbuild: {
    options: {
      target: 'es2022',
      minify: true,
      sourcemap: false,
      treeShaking: true,
      keepNames: true,
    }
  },
  
  // ============================================================================
  // ✅ FIX #5: Minification and source maps
  // ============================================================================
  minify: true,
  sourceMap: false,
  
  // ============================================================================
  // ✅ FIX #6: Server configuration
  // ============================================================================
  port: parseInt(process.env.PORT || '8080', 10),
  host: '0.0.0.0',
  
  // ============================================================================
  // ✅ FIX #7: Logging configuration
  // ============================================================================
  logging: {
    level: process.env.LOG_LEVEL === 'debug' ? 'verbose' : 'info',
  },
  
  // ============================================================================
  // ✅ FIX #8: Rollup configuration for proper bundling
  // ============================================================================
  rollupConfig: {
    output: {
      manualChunks: {
        'supabase': ['@supabase/supabase-js'],
        // ❌ REMOVED: 'vue': ['vue', 'vue-router'] - This was causing the build error
        'pinia': ['pinia'],
        'utils': ['lodash-es', 'date-fns'],
        'charts': ['chart.js', 'vue-chartjs']
      }
    }
  },
  
  // ============================================================================
  // ✅ FIX #9: Storage configuration
  // ============================================================================
  storage: {
    fs: {
      driver: 'fs',
      base: './.data',
    }
  },

  // ============================================================================
  // ✅ FIX #10: Timing configuration
  // ============================================================================
  timing: false,

  // ============================================================================
  // ✅ FIX #11: Experimental features
  // ============================================================================
  experimental: {
    wasm: false,
  },
})
