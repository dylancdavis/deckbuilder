import type { Meta, StoryObj } from '@storybook/vue3'
import ScarabSvg from '@/components/ScarabSvg.vue'

const meta = {
  title: 'Components/ScarabSvg',
  component: ScarabSvg,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'range', min: 16, max: 400, step: 8 },
      description: 'Size of the SVG icon in pixels'
    },
    color: {
      control: { type: 'color' },
      description: 'Color of the SVG icon (uses currentColor)'
    }
  }
} satisfies Meta<typeof ScarabSvg>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 128,
    color: '#000000'
  },
  decorators: [
    (story, { args }) => ({
      components: { story },
      setup() {
        return { args }
      },
      template: `
        <div :style="{
          width: args.size + 'px',
          height: args.size + 'px',
          color: args.color
        }">
          <story />
        </div>
      `
    })
  ]
}

export const Large: Story = {
  args: {
    size: 200,
    color: '#000000'
  },
  decorators: [
    (story, { args }) => ({
      components: { story },
      setup() {
        return { args }
      },
      template: `
        <div :style="{
          width: args.size + 'px',
          height: args.size + 'px',
          color: args.color
        }">
          <story />
        </div>
      `
    })
  ]
}

export const Small: Story = {
  args: {
    size: 32,
    color: '#000000'
  },
  decorators: [
    (story, { args }) => ({
      components: { story },
      setup() {
        return { args }
      },
      template: `
        <div :style="{
          width: args.size + 'px',
          height: args.size + 'px',
          color: args.color
        }">
          <story />
        </div>
      `
    })
  ]
}

export const ColorVariations: Story = {
  args: {
    size: 64,
    color: '#3b82f6'
  },
  decorators: [
    (story, { args }) => ({
      components: { story },
      setup() {
        return { args }
      },
      template: `
        <div :style="{
          width: args.size + 'px',
          height: args.size + 'px',
          color: args.color
        }">
          <story />
        </div>
      `
    })
  ]
}