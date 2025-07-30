/**
 * Deck utility functions
 */

import { total, missingCounts } from './counter.js'

/**
 * Returns true if a deck has a rules card.
 */
export function hasRulesCard(deck) {
  return deck.rulesCard != null
}

/**
 * Returns true if a deck has a size within the range specified by its rules card.
 */
export function deckInSizeRange(deck) {
  if (!deck.rulesCard) return true

  const deckSize = total(deck.cards)
  const [minSize, maxSize] = deck.rulesCard.deckLimits?.size || [0, Infinity]

  return minSize <= deckSize && deckSize <= maxSize
}

/**
 * Returns a counter of cards in deck that are not in collection, with values equal to the number of cards missing.
 */
export function cardsNotInCollection(deck, collection) {
  return missingCounts(deck.cards, collection)
}

/**
 * Given a deck and collection, returns a map indicating whether each check was passed.
 */
export function checkDeckValidity(deck, collection) {
  const missingCards = cardsNotInCollection(deck, collection)

  return {
    hasCardsInCollection: Object.keys(missingCards).length === 0,
    hasRulesCard: hasRulesCard(deck),
    inSizeRange: deckInSizeRange(deck)
  }
}
