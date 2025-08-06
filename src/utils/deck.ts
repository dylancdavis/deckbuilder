/**
 * Deck utility functions
 */

import type { Collection, Deck } from '@/stores/game.ts'
import { total, missingCounts } from './counter.ts'

/**
 * Returns true if a deck has a rules card.
 */
export function hasRulesCard(deck: Deck) {
  return deck.rulesCard != null
}

/**
 * Returns true if a deck has a size within the range specified by its rules card.
 */
export function deckInSizeRange(deck: Deck) {
  if (!deck.rulesCard) return true

  const deckSize = total(deck.cards)
  const [minSize, maxSize] = deck.rulesCard.deckLimits?.size || [0, Infinity]

  return minSize <= deckSize && deckSize <= maxSize
}

/**
 * Returns a counter of cards in deck that are not in collection, with values equal to the number of cards missing.
 */
export function cardsNotInCollection(deck: Deck, collection: Collection) {
  return missingCounts(deck.cards, collection.cards)
}

/**
 * Given a deck and collection, returns a map indicating whether each check was passed.
 */
export function checkDeckValidity(deck: Deck, collection: Collection) {
  const missingCards = cardsNotInCollection(deck, collection)

  return {
    hasCardsInCollection: Object.keys(missingCards).length === 0,
    hasRulesCard: hasRulesCard(deck),
    inSizeRange: deckInSizeRange(deck),
  }
}
