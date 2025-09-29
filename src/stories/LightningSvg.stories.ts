import type { Meta, StoryObj } from '@storybook/vue3'
import LightningSvg from '@/components/LightningSvg.vue'

const meta = {
  title: 'Components/LightningSvg',
  component: LightningSvg,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {}
} satisfies Meta<typeof LightningSvg>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Large: Story = {
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 200px; height: 200px;">
          <story />
        </div>
      `
    })
  ]
}

export const Small: Story = {
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 32px; height: 32px;">
          <story />
        </div>
      `
    })
  ]
}

export const ColorVariations: Story = {
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 64px; height: 64px; color: #fbbf24;">
          <story />
        </div>
      `
    })
  ]
}