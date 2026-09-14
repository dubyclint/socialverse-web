import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': rootDir,
      '@': rootDir
    }
  },
  test: {
    environment: 'node'
  }
})
