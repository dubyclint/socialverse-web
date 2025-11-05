// FILE: /nitro.config.ts - COMPLETE FIXED VERSION
// ============================================================================

export default defineNitroConfig({
  preset: 'node-server',
  
  // ✅ Explicitly include server directory
  srcDir: 'server',
  
  // ✅ Ensure API routes are discovered and not cached
  routeRules: {
    '/api/**': { cache: false },
    '/auth/**': { cache: false },
  },
  
  // ✅ Prerender configuration
  prerender: {
    crawlLinks: false,
    routes: ['/sitemap.xml', '/robots.txt'],
    ignore: ['/admin', '/api', '/auth'],
    failOnError: false,
  },
})
