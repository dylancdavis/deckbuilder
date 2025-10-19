import type { Run } from '../../../utils/run'
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
