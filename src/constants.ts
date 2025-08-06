import type { Deck } from './stores/game.ts'
import { cards } from './utils/cards.ts'

export const startingDeck: Deck = {
  name: 'Starter Deck',
  cards: {},
  rulesCard: cards['starter-rules'],
  editable: false,
}
