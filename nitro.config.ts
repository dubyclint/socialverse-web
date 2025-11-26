// nitro.config.ts - HYBRID CONFIGURATION
export default defineNitroConfig({
  prerender: {
    crawlLinks: false,
    routes: ['/sitemap.xml', '/robots.txt'],
    ignore: [
      '/admin/**',
      '/api/**',
      '/follows/**',
      '/stream/**',
      '/posts/**',
      '/profile/**',
      '/user/**',
      '/notifications/**',
      '/chat/**',
      '/group-chat/**',
      '/match/**',
      '/wallet-lock/**',
      '/premium/**',
      '/verified/**',
      '/rank/**',
      '/status/**',
      '/presence/**',
      '/universe/**',
      '/support/**',
      '/storage/**',
      '/ads/**',
      '/escrow/**',
      '/pewgift/**',
      '/interests/**'
    ]
  },
  esbuild: {
    options: {
      target: 'es2022'
    }
  }
})
