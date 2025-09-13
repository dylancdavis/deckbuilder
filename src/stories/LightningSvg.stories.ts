import type { Meta, StoryObj } from '@storybook/vue3'
import LightningSvg from '@/components/LightningSvg.vue'

const meta = {
  title: 'Components/LightningSvg',
  component: LightningSvg,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LightningSvg>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Large: Story = {
  decorators: [
    () => ({
      template: '<div style="width: 200px; height: 200px;"><story/></div>'
    })
  ]
}

export const Small: Story = {
  decorators: [
    () => ({
      template: '<div style="width: 32px; height: 32px;"><story/></div>'
    })
  ]
}