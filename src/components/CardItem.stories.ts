import type { Meta, StoryObj } from '@storybook/vue3';
import CardItem from './CardItem.vue';
import { score, dualScore, starterRules, buyBasic, saveReward, pointReset } from '../utils/cards';

const meta = {
  title: 'Components/CardItem',
  component: CardItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    card: {
      control: 'object',
      description: 'The card object to display',
    },
  },
} satisfies Meta<typeof CardItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScoreCard: Story = {
  args: {
    card: score,
  },
};

export const DualScoreCard: Story = {
  args: {
    card: dualScore,
  },
};

export const BuyBasicCard: Story = {
  args: {
    card: buyBasic,
  },
};

export const SaveRewardCard: Story = {
  args: {
    card: saveReward,
  },
};

export const PointResetCard: Story = {
  args: {
    card: pointReset,
  },
};

export const RulesCard: Story = {
  args: {
    card: starterRules,
  },
};

export const CustomPlayableCard: Story = {
  args: {
    card: {
      type: 'playable',
      id: 'custom-card',
      name: 'Custom Card',
      description: 'This is a custom card with controls',
      cost: 5,
      effects: ['gain-resource', 'points', 3],
      deckLimit: 1,
    },
  },
  argTypes: {
    'card.name': {
      control: 'text',
    },
    'card.description': {
      control: 'text',
    },
    'card.cost': {
      control: { type: 'number', min: 0, max: 20 },
    },
    'card.deckLimit': {
      control: { type: 'number', min: 1, max: 4 },
    },
  },
};

export const CustomRulesCard: Story = {
  args: {
    card: {
      type: 'rules',
      id: 'custom-rules',
      name: 'Custom Rules',
      deckLimits: { size: [10, 20] },
      turnStructure: {
        drawAmount: 3,
        playAmount: 'any',
        discardAmount: 'all',
      },
      endConditions: { rounds: 3 },
      effects: {
        gameStart: [],
      },
    },
  },
  argTypes: {
    'card.name': {
      control: 'text',
    },
    'card.deckLimits.size': {
      control: 'object',
    },
    'card.endConditions.rounds': {
      control: { type: 'number', min: 1, max: 10 },
    },
  },
};