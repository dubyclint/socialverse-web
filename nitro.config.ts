// nitro.config.ts - NITRO CONFIGURATION
export default defineNitroConfig({
  prerender: {
    crawlLinks: false,
    routes: [],
    ignore: ['/**'],
    failOnError: false
  },
  esbuild: {
    options: {
      target: 'es2022'
    }
  }
})
