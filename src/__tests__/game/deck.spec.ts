import { describe, it, expect } from 'vitest'
import { hasRulesCard, deckInSizeRange } from '../../utils/deck.js'

describe('hasRulesCard', () => {
  it('returns false when no rules card', () => {
    expect(hasRulesCard({ cards: {}, rulesCard: null })).toBe(false)
  })

  it('returns true when rules card exists', () => {
    expect(hasRulesCard({ cards: {}, rulesCard: {} })).toBe(true)
  })
})

describe('deckInSizeRange', () => {
  it('empty deck should be vacuously true when no rules card', () => {
    expect(deckInSizeRange({ cards: {}, rulesCard: null })).toBe(true)
  })

  it('populated deck should be vacuously true when no rules card', () => {
    expect(deckInSizeRange({ cards: { a: 3 }, rulesCard: null })).toBe(true)
  })

  it('empty deck should be valid for [0,0]', () => {
    expect(deckInSizeRange({
      cards: {},
      rulesCard: { deckLimits: { size: [0, 0] } }
    })).toBe(true)
  })

  it('deck below minimum size should be invalid', () => {
    expect(deckInSizeRange({
      cards: { a: 3 },
      rulesCard: { deckLimits: { size: [4, 8] } }
    })).toBe(false)
  })

  it('deck above maximum size should be invalid', () => {
    expect(deckInSizeRange({
      cards: { a: 9 },
      rulesCard: { deckLimits: { size: [4, 8] } }
    })).toBe(false)
  })

  it('deck with minimum size should be valid', () => {
    expect(deckInSizeRange({
      cards: { a: 4 },
      rulesCard: { deckLimits: { size: [4, 8] } }
    })).toBe(true)
  })

  it('deck between range should be valid', () => {
    expect(deckInSizeRange({
      cards: { a: 6 },
      rulesCard: { deckLimits: { size: [4, 8] } }
    })).toBe(true)
  })

  it('deck with maximum size should be valid', () => {
    expect(deckInSizeRange({
      cards: { a: 8 },
      rulesCard: { deckLimits: { size: [4, 8] } }
    })).toBe(true)
  })
})
