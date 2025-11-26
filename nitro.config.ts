// nitro.config.ts - DISABLE PRERENDER WITH FAIL ON ERROR FALSE
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
