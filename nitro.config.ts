export default defineNitroConfig({
  presets: ['node-server'],
  // Let Nuxt handle the output directory - use default .output
  // Remove the custom output path that conflicts with Nuxt's default
  rollupConfig: {
    output: {
      entryFileNames: 'index.mjs'
    }
  },
  minify: true,
  sourceMap: false,
  timing: false,
  noAnalyze: true,
  compressPublicAssets: true,
})
