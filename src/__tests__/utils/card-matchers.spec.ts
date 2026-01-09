import { describe, it, expect } from 'vitest'
import { matchesCard, isCardMatcher, type CardMatcher } from '../../utils/card-matchers'
import type { PlayableCard } from '../../utils/cards'

// Helper to create a minimal test card
function createTestCard(overrides: Partial<PlayableCard> = {}): PlayableCard {
  return {
    type: 'playable',
    id: 'test-card',
    name: 'Test Card',
    description: 'A test card',
    cost: 5,
    abilities: {},
    art: {
      gradient: ['#000', '#fff'],
      image: 'scarab',
    },
    ...overrides,
  } as PlayableCard
}

describe('matchesCard', () => {
  describe('cardId matching', () => {
    it('matches single cardId', () => {
      const card = createTestCard({ id: 'score' })
      const matcher: CardMatcher = { cardId: 'score' }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match different cardId', () => {
      const card = createTestCard({ id: 'score' })
      const matcher: CardMatcher = { cardId: 'debt' }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('matches cardId in array', () => {
      const card = createTestCard({ id: 'score' })
      const matcher: CardMatcher = { cardId: ['score', 'debt'] }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match cardId not in array', () => {
      const card = createTestCard({ id: 'point-loan' })
      const matcher: CardMatcher = { cardId: ['score', 'debt'] }

      expect(matchesCard(card, matcher)).toBe(false)
    })
  })

  describe('cost matching', () => {
    it('matches exact cost', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: 5 }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match different exact cost', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: 3 }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('matches cost >= min', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: { min: 3 } }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('matches cost == min', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: { min: 5 } }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match cost < min', () => {
      const card = createTestCard({ cost: 2 })
      const matcher: CardMatcher = { cost: { min: 3 } }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('matches cost <= max', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: { max: 7 } }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('matches cost == max', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: { max: 5 } }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match cost > max', () => {
      const card = createTestCard({ cost: 8 })
      const matcher: CardMatcher = { cost: { max: 5 } }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('matches cost within range', () => {
      const card = createTestCard({ cost: 5 })
      const matcher: CardMatcher = { cost: { min: 3, max: 7 } }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match cost outside range', () => {
      const card = createTestCard({ cost: 10 })
      const matcher: CardMatcher = { cost: { min: 3, max: 7 } }

      expect(matchesCard(card, matcher)).toBe(false)
    })
  })

  describe('tags matching (ALL tags)', () => {
    it('matches when card has all tags', () => {
      const card = createTestCard({ tags: ['basic', 'action'] })
      const matcher: CardMatcher = { tags: ['basic', 'action'] }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('matches when card has more tags than required', () => {
      const card = createTestCard({ tags: ['basic', 'action', 'rare'] })
      const matcher: CardMatcher = { tags: ['basic'] }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match when card is missing a tag', () => {
      const card = createTestCard({ tags: ['basic'] })
      const matcher: CardMatcher = { tags: ['basic', 'action'] }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('does not match when card has no tags', () => {
      const card = createTestCard({ tags: undefined })
      const matcher: CardMatcher = { tags: ['basic'] }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('matches empty tags array', () => {
      const card = createTestCard({ tags: [] })
      const matcher: CardMatcher = { tags: [] }

      expect(matchesCard(card, matcher)).toBe(true)
    })
  })

  describe('anyTag matching (ANY tag)', () => {
    it('matches when card has any of the tags', () => {
      const card = createTestCard({ tags: ['basic'] })
      const matcher: CardMatcher = { anyTag: ['basic', 'action'] }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('matches when card has all of the tags', () => {
      const card = createTestCard({ tags: ['basic', 'action'] })
      const matcher: CardMatcher = { anyTag: ['basic', 'action'] }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match when card has none of the tags', () => {
      const card = createTestCard({ tags: ['rare'] })
      const matcher: CardMatcher = { anyTag: ['basic', 'action'] }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('does not match when card has no tags', () => {
      const card = createTestCard({ tags: undefined })
      const matcher: CardMatcher = { anyTag: ['basic'] }

      expect(matchesCard(card, matcher)).toBe(false)
    })
  })

  describe('combined matching', () => {
    it('matches when all conditions are met', () => {
      const card = createTestCard({ id: 'score', cost: 5, tags: ['basic'] })
      const matcher: CardMatcher = {
        cardId: 'score',
        cost: { min: 3 },
        tags: ['basic'],
      }

      expect(matchesCard(card, matcher)).toBe(true)
    })

    it('does not match when one condition fails', () => {
      const card = createTestCard({ id: 'score', cost: 5, tags: ['basic'] })
      const matcher: CardMatcher = {
        cardId: 'score',
        cost: { min: 10 },
        tags: ['basic'],
      }

      expect(matchesCard(card, matcher)).toBe(false)
    })

    it('matches empty matcher (matches any card)', () => {
      const card = createTestCard({ id: 'score', cost: 5, tags: ['basic'] })
      const matcher: CardMatcher = {}

      expect(matchesCard(card, matcher)).toBe(true)
    })
  })
})

describe('isCardMatcher', () => {
  it('returns true for object matcher', () => {
    expect(isCardMatcher({ cardId: 'score' })).toBe(true)
  })

  it('returns true for empty object matcher', () => {
    expect(isCardMatcher({})).toBe(true)
  })

  it('returns false for self', () => {
    expect(isCardMatcher('self')).toBe(false)
  })

  it('returns false for any', () => {
    expect(isCardMatcher('any')).toBe(false)
  })

  it('returns false for other', () => {
    expect(isCardMatcher('other')).toBe(false)
  })
})
