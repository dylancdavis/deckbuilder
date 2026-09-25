import { describe, it, expect, vi } from 'vitest'
import { hasRulesCard, deckInSizeRange } from '../../utils/deck.js'
import type { RulesCardID } from '../../utils/cards.js'

// Decks reference rules cards by id, so register rules cards with the size
// ranges under test alongside the real ones.
vi.mock('../../utils/cards.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../utils/cards.js')>()
  const rulesWithSize = (id: string, size: [number, number]) => ({
    ...original.starterRules,
    id,
    deckLimits: { size },
  })
  return {
    ...original,
    cards: {
      ...original.cards,
      'size-0-0': rulesWithSize('size-0-0', [0, 0]),
      'size-4-8': rulesWithSize('size-4-8', [4, 8]),
    },
  }
})

const rulesWithSize = (size: [number, number]) => `size-${size[0]}-${size[1]}` as RulesCardID

describe('hasRulesCard', () => {
  it('returns false when no rules card', () => {
    expect(hasRulesCard({ name: 'Test', cards: {}, rulesCardId: null })).toBe(false)
  })

  it('returns true when rules card exists', () => {
    expect(hasRulesCard({ name: 'Test', cards: {}, rulesCardId: 'starter-rules' })).toBe(true)
  })
})

describe('deckInSizeRange', () => {
  it('empty deck should be vacuously true when no rules card', () => {
    expect(deckInSizeRange({ name: 'Test', cards: {}, rulesCardId: null })).toBe(true)
  })

  it('populated deck should be vacuously true when no rules card', () => {
    expect(deckInSizeRange({ name: 'Test', cards: { score: 3 }, rulesCardId: null })).toBe(true)
  })

  it('empty deck should be valid for [0,0]', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: {},
        rulesCardId: rulesWithSize([0, 0]),
      }),
    ).toBe(true)
  })

  it('deck below minimum size should be invalid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 3 },
        rulesCardId: rulesWithSize([4, 8]),
      }),
    ).toBe(false)
  })

  it('deck above maximum size should be invalid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 9 },
        rulesCardId: rulesWithSize([4, 8]),
      }),
    ).toBe(false)
  })

  it('deck with minimum size should be valid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 4 },
        rulesCardId: rulesWithSize([4, 8]),
      }),
    ).toBe(true)
  })

  it('deck between range should be valid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 6 },
        rulesCardId: rulesWithSize([4, 8]),
      }),
    ).toBe(true)
  })

  it('deck with maximum size should be valid', () => {
    expect(
      deckInSizeRange({
        name: 'Test',
        cards: { score: 8 },
        rulesCardId: rulesWithSize([4, 8]),
      }),
    ).toBe(true)
  })
})
