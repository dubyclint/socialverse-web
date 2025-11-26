// nitro.config.ts - FIXED FOR SUPABASE ESM BUNDLING
export default defineNitroConfig({
  preset: 'node-server',
  
  // ✅ CRITICAL: Enable ESM module resolution
  esbuild: {
    options: {
      target: 'es2022',
      minify: true,
      format: 'esm',  // ← ADD THIS
      splitting: false,  // ← ADD THIS
    }
  },
  
  // ✅ Ensure Supabase is NOT externalized
  rollupConfig: {
    external: [],  // Don't externalize Supabase
  },
  
  // ✅ Node compatibility for ESM
  node: {
    preload: true,
  },
  
  prerender: {
    crawlLinks: false,
    routes: [],
    ignore: ['/**'],
    failOnError: false
  },
  
  minify: true,
  sourceMap: false,
  
  middleware: ['compression', 'security'],
  
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
})
