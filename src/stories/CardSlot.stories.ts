import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CardGroup from '@/components/CardGroup.vue'
import CardSlot from '@/components/CardSlot.vue'

const meta: Meta<typeof CardSlot> = {
  title: 'Components/CardSlot',
  component: CardSlot,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { CardGroup, CardSlot },
    template: `
      <CardGroup>
        <CardSlot />
      </CardGroup>
    `,
  }),
}
