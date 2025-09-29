import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CardItem from '@/components/CardItem.vue'
import { cards } from '@/utils/cards'

const meta: Meta<typeof CardItem> = {
  title: 'Components/CardItem',
  component: CardItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    card: cards.score
  }
}
