import { describe, it, expect } from 'vitest'
import { hasRulesCard, deckInSizeRange } from '../../utils/deck.js'
import { starterRules } from '../../utils/cards.js'

const rulesWithSize = (size: [number, number]) => ({
  ...starterRules,
  deckLimits: { size },
})

describe('hasRulesCard', () => {
  it('returns false when no rules card', () => {
    expect(hasRulesCard({ name: 'Test', cards: {}, rulesCard: null })).toBe(false)
  })

  it('returns true when rules card exists', () => {
    expect(hasRulesCard({ name: 'Test', cards: {}, rulesCard: starterRules })).toBe(true)
  })
})

describe('deckInSizeRange', () => {
  it('empty deck should be vacuously true when no rules card', () => {
    expect(deckInSizeRange({ name: 'Test', cards: {}, rulesCard: null })).toBe(true)
  })

  it('populated deck should be vacuously true when no rules card', () => {
    expect(deckInSizeRange({ name: 'Test', cards: { score: 3 }, rulesCard: null })).toBe(true)
  })

  it('empty deck should be valid for [0,0]', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: {},
        rulesCard: rulesWithSize([0, 0]),
      }),
    ).toBe(true)
  })

  it('deck below minimum size should be invalid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 3 },
        rulesCard: rulesWithSize([4, 8]),
      }),
    ).toBe(false)
  })

  it('deck above maximum size should be invalid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 9 },
        rulesCard: rulesWithSize([4, 8]),
      }),
    ).toBe(false)
  })

  it('deck with minimum size should be valid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 4 },
        rulesCard: rulesWithSize([4, 8]),
      }),
    ).toBe(true)
  })

  it('deck between range should be valid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 6 },
        rulesCard: rulesWithSize([4, 8]),
      }),
    ).toBe(true)
  })

  it('deck with maximum size should be valid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 8 },
        rulesCard: rulesWithSize([4, 8]),
      }),
    ).toBe(true)
  })
})
