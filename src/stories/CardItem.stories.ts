import type { Meta, StoryObj } from '@storybook/vue3'
import CardItem from '@/components/CardItem.vue'
import { cards } from '@/utils/cards'

const meta = {
  title: 'Components/CardItem',
  component: CardItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    card: {
      control: { type: 'select' },
      options: Object.keys(cards),
      mapping: cards,
      description: 'Select a card to display'
    }
  },
} satisfies Meta<typeof CardItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    card: cards.score
  }
}

export const PlayableCard: Story = {
  args: {
    card: cards.score
  }
}

export const PlayableCardWithDeckLimit: Story = {
  args: {
    card: cards['dual-score']
  }
}

export const RulesCard: Story = {
  args: {
    card: cards['starter-rules']
  }
}

export const HighCostCard: Story = {
  args: {
    card: cards['last-resort']
  }
}