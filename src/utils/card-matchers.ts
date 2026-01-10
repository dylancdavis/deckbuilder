import type { PlayableCardID } from './cards'

export type CardMatcher = {
  cardId?: PlayableCardID | PlayableCardID[]
  cost?: number | { min?: number; max?: number }
  tags?: string[]
  anyTag?: string[]
}

/**
 * Special matcher values for targeting cards.
 * - 'self': Only the card with this trigger
 * - 'any': Any card
 * - 'other': Any card except self
 * - CardMatcher: Cards matching specific criteria
 */
export type TargetSpec = 'self' | 'any' | 'other' | CardMatcher

/**
 * Minimal card shape needed for matching.
 */
type MatchableCard = {
  id: PlayableCardID
  cost: number
  tags?: string[]
}

/**
 * Evaluates whether a card matches the matcher criteria.
 * Returns true if the card satisfies all conditions in the matcher.
 *
 * @param card - The card to evaluate
 * @param matcher - The matching criteria
 * @returns true if the card matches all criteria
 */
export function matchesCard(card: MatchableCard, matcher: CardMatcher): boolean {
  // Check cardId match
  if (matcher.cardId !== undefined) {
    const ids = Array.isArray(matcher.cardId) ? matcher.cardId : [matcher.cardId]
    if (!ids.includes(card.id)) return false
  }

  // Check cost match
  if (matcher.cost !== undefined) {
    if (typeof matcher.cost === 'number') {
      if (card.cost !== matcher.cost) return false
    } else {
      if (matcher.cost.min !== undefined && card.cost < matcher.cost.min) return false
      if (matcher.cost.max !== undefined && card.cost > matcher.cost.max) return false
    }
  }

  // Check tags match (ALL tags must be present)
  if (matcher.tags !== undefined) {
    if (!matcher.tags.every((tag) => card.tags?.includes(tag))) return false
  }

  // Check anyTag match (at least ONE tag must be present)
  if (matcher.anyTag !== undefined) {
    if (!matcher.anyTag.some((tag) => card.tags?.includes(tag))) return false
  }

  return true
}
