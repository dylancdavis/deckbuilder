import { cards } from './utils/cards.ts'
import type { Deck } from './utils/deck.ts'

export const startingDeck: Deck = {
  name: 'Starter Deck',
  cards: {},
  rulesCard: cards['starter-rules'],
  editable: false,
}
