import type { CardID } from './utils/cards.ts'
import type { Collection } from './utils/collection.ts'
import type { Counter } from './utils/counter.ts'
import type { Deck } from './utils/deck.ts'

const startingDeck: Deck = {
  name: 'Starter Deck',
  cards: {},
  rulesCardId: 'starter-rules',
}

const discardTestDeck: Deck = {
  name: 'Discard Test Deck',
  cards: {},
  rulesCardId: 'discard-test-rules',
}

const moveTestDeck: Deck = {
  name: 'Move Test Deck',
  cards: {},
  rulesCardId: 'move-test-rules',
}

const choiceTestDeck: Deck = {
  name: 'Choice Test Deck',
  cards: {},
  rulesCardId: 'choice-test-rules',
}

const attackTestDeck: Deck = {
  name: 'Attack Test Deck',
  cards: { striker: 1, 'thorn-dummy': 1 },
  rulesCardId: 'attack-test-rules',
}

const testCollectionCards: Counter<CardID> = {
  score: 4,
  'collect-basic': 4,
  'dual-score': 4,
  'save-reward': 4,
  'zero-reward': 4,
  'point-reset': 4,
  'point-multiply': 4,
  'score-surge': 4,
  'score-synergy': 4,
  'point-loan': 4,
  'last-resort': 4,
  'starter-rules': 1,
  // Test cards
  'test-rules': 1,
  'discard-test-rules': 1,
  'hand-board-discard': 4,
  'move-test-rules': 1,
  'hand-to-board': 4,
  'double-choice': 4,
  'choice-draw': 4,
  'draw-watcher': 4,
  'draw-bonus': 4,
  'choice-add-choice': 4,
  'choice-test-rules': 1,
  'basic-entity': 4,
  'target-dummy': 4,
  'attack-test-rules': 1,
  striker: 4,
  'thorn-dummy': 4,
  'basic-striker': 4,
}

export const presetSaves = {
  default: {
    cards: { 'starter-rules': 1 },
    decks: { startingDeck },
  },
  test: {
    cards: testCollectionCards,
    decks: { startingDeck, discardTestDeck, moveTestDeck, choiceTestDeck, attackTestDeck },
  },
} satisfies Record<string, Collection>

export type PresetSave = keyof typeof presetSaves
