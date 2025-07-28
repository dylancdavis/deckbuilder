import { describe, it, expect } from 'vitest'
import type { Deck, Card } from '@/types/game'

// Deck validation functions adapted from ClojureScript implementation
export function hasRulesCard(deck: Deck): boolean {
  return deck.rulesCard !== null && deck.rulesCard !== undefined && deck.rulesCard !== ''
}

export function isDeckInSizeRange(deck: Deck, rulesCard: Card | null): boolean {
  if (!rulesCard || !rulesCard.deckLimits) {
    return true // Vacuously true when no rules card or no size limits
  }

  const totalCards = Object.values(deck.cards).reduce((sum, count) => sum + count, 0)
  const [minSize, maxSize] = rulesCard.deckLimits.size

  return totalCards >= minSize && totalCards <= maxSize
}

describe('Deck Utilities', () => {
  describe('hasRulesCard', () => {
    it('correctly identifies presence of rules card', () => {
      expect(hasRulesCard({ name: 'Test', cards: {}, rulesCard: '', editable: true })).toBe(false)
      expect(hasRulesCard({ name: 'Test', cards: {}, rulesCard: 'starter-rules', editable: true })).toBe(true)
    })
  })

  describe('isDeckInSizeRange', () => {
    const emptyDeck: Deck = { name: 'Test', cards: {}, rulesCard: 'starter-rules', editable: true }
    const populatedDeck: Deck = { name: 'Test', cards: { a: 3 }, rulesCard: 'starter-rules', editable: true }

    it('handles no rules card correctly', () => {
      expect(isDeckInSizeRange(emptyDeck, null)).toBe(true)
      expect(isDeckInSizeRange(populatedDeck, null)).toBe(true)
    })

    it('validates deck size ranges correctly', () => {
      const rulesCard: Card = {
        name: 'Test Rules',
        description: 'Test',
        cost: 0,
        type: 'rules',
        deckLimits: { size: [0, 0] }
      }
      expect(isDeckInSizeRange(emptyDeck, rulesCard)).toBe(true)

      const rangeRules: Card = {
        name: 'Range Rules',
        description: 'Test',
        cost: 0,
        type: 'rules',
        deckLimits: { size: [4, 8] }
      }

      const smallDeck: Deck = { name: 'Test', cards: { a: 3 }, rulesCard: 'range-rules', editable: true }
      const largeDeck: Deck = { name: 'Test', cards: { a: 9 }, rulesCard: 'range-rules', editable: true }
      const validMinDeck: Deck = { name: 'Test', cards: { a: 4 }, rulesCard: 'range-rules', editable: true }
      const validMidDeck: Deck = { name: 'Test', cards: { a: 6 }, rulesCard: 'range-rules', editable: true }
      const validMaxDeck: Deck = { name: 'Test', cards: { a: 8 }, rulesCard: 'range-rules', editable: true }

      expect(isDeckInSizeRange(smallDeck, rangeRules)).toBe(false)
      expect(isDeckInSizeRange(largeDeck, rangeRules)).toBe(false)
      expect(isDeckInSizeRange(validMinDeck, rangeRules)).toBe(true)
      expect(isDeckInSizeRange(validMidDeck, rangeRules)).toBe(true)
      expect(isDeckInSizeRange(validMaxDeck, rangeRules)).toBe(true)
    })
  })
})