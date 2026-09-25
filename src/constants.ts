import type { Deck } from './utils/deck.ts'

export const startingDeck: Deck = {
  name: 'Starter Deck',
  cards: {},
  rulesCardId: 'starter-rules',
}

export const discardTestDeck: Deck = {
  name: 'Discard Test Deck',
  cards: {},
  rulesCardId: 'discard-test-rules',
}

export const moveTestDeck: Deck = {
  name: 'Move Test Deck',
  cards: {},
  rulesCardId: 'move-test-rules',
}

export const choiceTestDeck: Deck = {
  name: 'Choice Test Deck',
  cards: {},
  rulesCardId: 'choice-test-rules',
}

export const attackTestDeck: Deck = {
  name: 'Attack Test Deck',
  cards: { striker: 1, 'thorn-dummy': 1 },
  rulesCardId: 'attack-test-rules',
}
