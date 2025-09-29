import type { Meta, StoryObj } from '@storybook/vue3'
import LightningSvg from '@/components/LightningSvg.vue'

const meta = {
  title: 'Components/LightningSvg',
  component: LightningSvg,
  parameters: {
    layout: 'centered',
  },
  argTypes: {}
} satisfies Meta<typeof LightningSvg>

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

