import type { Meta, StoryObj } from '@storybook/vue3';
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';
import CollectionView from './CollectionView.vue';
import { useGameStore } from '../stores/game';
import { startingDeck } from '../constants';

setup((app) => {
  app.use(createPinia());
});

const meta = {
  title: 'Components/CollectionView',
  component: CollectionView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
  },
};

export const WithSelectedDeck: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.selectDeck('startingDeck');
  },
};

export const WithMultipleDecks: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.collection.decks = {
      startingDeck: startingDeck,
      customDeck1: {
        name: 'Speed Deck',
        rulesCard: null,
        cards: { 'score': 5, 'dual-score': 2 },
        editable: true,
      },
      customDeck2: {
        name: 'Control Deck',
        rulesCard: null,
        cards: { 'buy-basic': 3, 'save-reward': 2 },
        editable: true,
      },
    };
  },
};

export const WithLargeCollection: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.collection.cards = {
      'score': 20,
      'dual-score': 10,
      'buy-basic': 15,
      'save-reward': 5,
      'zero-reward': 8,
      'point-reset': 3,
      'point-multiply': 4,
      'score-surge': 2,
      'score-synergy': 2,
      'borrow-points': 1,
      'last-resort': 1,
      'starter-rules': 3,
    };
  },
};

export const EmptyCollection: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.collection.cards = {};
    gameStore.collection.decks = {};
  },
};