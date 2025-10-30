import type { Run } from '../../../utils/run'
import type { GameState } from '../../../utils/game'
import { starterRules } from '../../../utils/cards'

/**
 * Helper to create a minimal run for testing effects
 */
export const createTestRun = (overrides: Partial<Run> = {}): Run => ({
  deck: {
    name: 'Test Deck',
    editable: false,
    cards: { score: 1 },
    rulesCard: starterRules,
  },
  cards: {
    drawPile: [],
    hand: [],
    board: [],
    stack: [],
    discardPile: [],
  },
  resources: {
    points: 0,
  },
  stats: {
    turns: 1,
    rounds: 1,
  },
  events: [],
  ...overrides,
})

/**
 * Helper to create a minimal game state for testing effects
 */
export const createTestGameState = (runOverrides: Partial<Run> = {}): GameState => ({
  game: {
    collection: {
      cards: {},
      decks: {},
    },
    run: createTestRun(runOverrides),
  },
  ui: {
    currentView: ['run'],
    collection: {
      selectedDeck: null,
    },
  },
  viewData: {
    modalView: null,
    cardOptions: [],
    resolver: null,
  },
})
