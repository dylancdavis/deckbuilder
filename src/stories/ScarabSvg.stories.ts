import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ScarabSvg from '@/components/ScarabSvg.vue'

const meta = {
  title: 'Components/ScarabSvg',
  component: ScarabSvg,
  parameters: {
    layout: 'centered',
  },
  argTypes: {}
} satisfies Meta<typeof ScarabSvg>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 128px; height: 128px;">
          <story />
        </div>
      `
    })
  ]
}

