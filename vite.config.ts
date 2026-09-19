import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/deckbuilder/',
  // Storybook sets STORYBOOK=true before it loads this config. DevTools adds
  // vite-plugin-inspect, whose client context is unavailable in Storybook.
  plugins: [vue(), ...(process.env.STORYBOOK ? [] : [vueDevTools()])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
