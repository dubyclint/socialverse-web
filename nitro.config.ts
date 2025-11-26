// nitro.config.ts - HYBRID CONFIGURATION
export default defineNitroConfig({
  prerender: false,
  esbuild: {
    options: {
      target: 'es2022'
    }
  }
})
