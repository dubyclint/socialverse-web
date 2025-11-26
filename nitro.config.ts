// nitro.config.ts - COMPLETELY DISABLE PRERENDER
export default defineNitroConfig({
  prerender: {
    crawlLinks: false,
    routes: [],
    ignore: ['/**']
  },
  esbuild: {
    options: {
      target: 'es2022'
    }
  }
})
