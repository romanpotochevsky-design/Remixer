import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * `ARTIFACT=1` squeezes the bundle harder, and it exists for one measured reason:
 * the artifact host refuses a page over roughly 690 KB once its own wrapper is
 * added, and this single-file build had grown past that. Terser with two compress
 * passes buys what esbuild leaves on the table; it is slower, so ordinary
 * `npm run dev` / `npm run build` stay on esbuild and only `npm run artifact`
 * pays for it. Nothing about the OUTPUT differs beyond minification.
 */
const SQUEEZE = process.env.ARTIFACT === '1'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 5273, host: '127.0.0.1' },
  build: SQUEEZE
    ? {
        minify: 'terser',
        terserOptions: {
          /* `module` + `toplevel` let terser rename and drop across the whole ES
             module, which is where most of the win is; the `unsafe_*` flags are
             the narrow ones (arrow/method shorthand, Symbol calls) and the build
             is pixel-diffed and click-tested after, not trusted. */
          module: true,
          toplevel: true,
          compress: {
            passes: 3,
            drop_console: true,
            drop_debugger: true,
            unsafe_arrows: true,
            unsafe_methods: true,
            unsafe_symbols: true,
          },
          format: { comments: false },
        },
      }
    : {},
})
