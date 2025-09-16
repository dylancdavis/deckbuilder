/**
 * Deck utility functions
 */

import type { Collection, Deck } from '@/stores/game.ts'
import { total, missingCounts, type Counter } from './counter.ts'
import { cards, type CardID, type PlayableCard, type PlayableCardID } from './cards.ts'
import { entries, keys } from './utils.ts'

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
    hasCardsInCollection: keys(missingCards).length === 0,
    hasRulesCard: hasRulesCard(deck),
    inSizeRange: deckInSizeRange(deck),
  }
}

/**
 * Given a deck and collection, returns an array of validation error messages.
 * Returns an empty array if the deck is valid.
 */
export function getDeckValidationErrors(deck: Deck, collection: Collection): string[] {
  const errors: string[] = []

  // Check if deck has a rules card
  if (!hasRulesCard(deck)) {
    errors.push('Deck must have a rules card')
  }

  // Check deck size against rules card limits
  if (deck.rulesCard && !deckInSizeRange(deck)) {
    const deckSize = total(deck.cards)
    const [minSize, maxSize] = deck.rulesCard.deckLimits?.size || [0, Infinity]

    if (deckSize < minSize) {
      errors.push(`Too few cards in deck (${deckSize}/${minSize})`)
    } else if (deckSize > maxSize) {
      errors.push(`Too many cards in deck (${deckSize}/${maxSize})`)
    }
  }

  // Check if player has enough cards in collection
  const missingCards = cardsNotInCollection(deck, collection)
  const missingCardEntries = entries(missingCards)

  if (missingCardEntries.length === 1) {
    const [cardId, missingCount] = missingCardEntries[0]
    const cardName = cards[cardId as CardID].name
    errors.push(`Missing ${cardName} from collection (${missingCount})`)
  } else if (missingCardEntries.length > 1) {
    errors.push('Missing cards from collection:')
    for (const [cardId, missingCount] of missingCardEntries) {
      const cardName = cards[cardId as CardID].name
      errors.push(`${cardName} (${missingCount})`)
    }
  }

  // Check individual card deck limits
  for (const [cardId, deckAmount] of entries(deck.cards)) {
    if (!deckAmount) continue

    const card = cards[cardId]
    if (card.type === 'playable' && card.deckLimit) {
      if (deckAmount > card.deckLimit) {
        errors.push(`"${card.name}" exceeds deck limit (${deckAmount}/${card.deckLimit})`)
      }
    }
  }

  return errors
}

/**
 * Given an array of cards, returns a counter of their IDs.
 */
export function pileToIdCounter(pile: PlayableCard[]): Counter<PlayableCardID> {
  const counter: Counter<PlayableCardID> = {}
  for (const card of pile) {
    counter[card.id] = (counter[card.id] || 0) + 1
  }
  return counter
}
