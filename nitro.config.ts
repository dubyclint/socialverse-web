// nitro.config.ts - PRODUCTION-READY CONFIGURATION
export default defineNitroConfig({
  preset: 'node-server',
  
  prerender: {
    crawlLinks: false,
    routes: [],
    ignore: ['/**'],
    failOnError: false
  },
  
  esbuild: {
    options: {
      target: 'es2022',
      minify: true
    }
  },
  
  // Production optimizations
  minify: true,
  sourceMap: false,
  
  // Middleware
  middleware: ['compression', 'security'],
  
  // Logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
})
