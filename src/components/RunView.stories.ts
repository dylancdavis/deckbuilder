import type { Meta, StoryObj } from '@storybook/vue3';
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';
import RunView from './RunView.vue';
import { useGameStore } from '../stores/game';
import { startingDeck } from '../constants';
import { score, buyBasic, dualScore, saveReward } from '../utils/cards';

setup((app) => {
  app.use(createPinia());
});

const meta = {
  title: 'Components/RunView',
  component: RunView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RunView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.startRun(startingDeck);
  },
};

export const WithHandCards: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.startRun(startingDeck);
    if (gameStore.run) {
      gameStore.run.cards.hand = [score, buyBasic, dualScore];
      gameStore.run.resources.points = 5;
    }
  },
};

export const WithBoardCards: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.startRun(startingDeck);
    if (gameStore.run) {
      gameStore.run.cards.hand = [score, buyBasic];
      gameStore.run.cards.board = [dualScore, saveReward];
      gameStore.run.resources.points = 10;
    }
  },
};

export const WithFullDiscard: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.startRun(startingDeck);
    if (gameStore.run) {
      gameStore.run.cards.hand = [score];
      gameStore.run.cards.discardPile = [buyBasic, dualScore, saveReward, score, score];
      gameStore.run.resources.points = 15;
    }
  },
};

export const MidGameState: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.startRun(startingDeck);
    if (gameStore.run) {
      gameStore.run.cards.hand = [score, dualScore, buyBasic];
      gameStore.run.cards.board = [saveReward];
      gameStore.run.cards.drawPile = [score, score, buyBasic];
      gameStore.run.cards.discardPile = [dualScore, score];
      gameStore.run.resources.points = 8;
      gameStore.run.stats.turns = 5;
      gameStore.run.stats.rounds = 2;
    }
  },
};

export const EmptyDrawPile: Story = {
  beforeEach: () => {
    const gameStore = useGameStore();
    gameStore.initializeDb();
    gameStore.startRun(startingDeck);
    if (gameStore.run) {
      gameStore.run.cards.drawPile = [];
      gameStore.run.cards.hand = [score, buyBasic, dualScore, saveReward];
      gameStore.run.cards.discardPile = [score, score, buyBasic];
      gameStore.run.resources.points = 20;
    }
  },
};