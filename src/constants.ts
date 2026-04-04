import { cards } from './utils/cards.ts'
import type { Deck } from './utils/deck.ts'

export const startingDeck: Deck = {
  name: 'Starter Deck',
  cards: {},
  rulesCard: cards['starter-rules'],
}

export const discardTestDeck: Deck = {
  name: 'Discard Test Deck',
  cards: {},
  rulesCard: cards['discard-test-rules'],
}

export const moveTestDeck: Deck = {
  name: 'Move Test Deck',
  cards: {},
  rulesCard: cards['move-test-rules'],
}

export const choiceTestDeck: Deck = {
  name: 'Choice Test Deck',
  cards: {},
  rulesCard: cards['choice-test-rules'],
}
