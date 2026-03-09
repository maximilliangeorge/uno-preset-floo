import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: 'playground',
  base: '/unocss-preset-floo/',
  esbuild: {
    target: 'es2022',
  },
  resolve: {
    alias: {
      '../src/index': resolve(__dirname, '../src/index.ts'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../playground-dist'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js built-in modules that UnoCSS sub-deps try to import
        if (id.startsWith('node:') || id === 'fs' || id === 'module')
          return true
        return false
      },
      output: {
        // Provide empty shims for externalized modules
        globals: {},
      },
    },
  },
})
