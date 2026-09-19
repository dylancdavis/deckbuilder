import type { StorybookConfig } from '@storybook/vue3-vite'

// Make the Storybook context available while Vite evaluates vite.config.ts.
process.env.STORYBOOK = 'true'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },
}
export default config
