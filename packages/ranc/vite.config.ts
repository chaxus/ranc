import path, { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

export default defineConfig({
  esbuild: {
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxInject:
      'import { createElement as jsx, createElement as h, Fragment } from "@/src/vdom"',
  },
  build: {
    minify: 'terser',
    rollupOptions: {
      external: ['node:fs', 'fs'],
    },
    lib: {
      entry: ['index.ts', 'jsx-runtime', 'jsx-dev-runtime'],
      name: 'ranc',
      formats: ['es', 'cjs'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  plugins: [dts()],
})
