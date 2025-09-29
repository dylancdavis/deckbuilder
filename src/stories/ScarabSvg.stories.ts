import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ScarabSvg from '@/components/ScarabSvg.vue'

const meta: Meta<typeof ScarabSvg> = {
  title: 'Components/ScarabSvg',
  component: ScarabSvg,
  parameters: {
    layout: 'centered',
  },
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

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

