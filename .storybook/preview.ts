import type { Preview } from '@storybook/vue3-vite'

// Import CSS files to make components look correct
import '../src/assets/css/reset.css'
import '../src/assets/css/index.css'
import '../src/assets/css/cards.css'
import '../src/assets/css/collection.css'
import '../src/assets/css/run.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;