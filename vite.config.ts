import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
const plugins: PluginOption[] = [vue()]

if (process.env.NODE_ENV !== 'production') {
  plugins.push(vueDevTools())
}

export default defineConfig({
  base: '/deckbuilder/',
  // vueDevTools() is currently incompatibile with Storybook.
  // Comment it out if Storybook is crashing.
  plugins,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
