import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: 'playground',
  resolve: {
    alias: {
      '../src/index': resolve(__dirname, '../src/index.ts'),
    },
  },
})
