import type { Meta, StoryObj } from '@storybook/vue3'
import CardItem from '@/components/CardItem.vue'
import { score, dualScore, starterRules } from '@/utils/cards'

const meta = {
  title: 'Components/CardItem',
  component: CardItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    card: {
      control: { type: 'object' }
    }
  },
} satisfies Meta<typeof CardItem>

export default meta
type Story = StoryObj<typeof meta>

export const PlayableCard: Story = {
  args: {
    card: score
  }
}

export const PlayableCardWithDeckLimit: Story = {
  args: {
    card: dualScore
  }
}

export const RulesCard: Story = {
  args: {
    card: starterRules
  }
}