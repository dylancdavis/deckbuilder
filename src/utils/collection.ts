/**
 * Collection utility functions
 */

import { firstMissingNum } from './utils.ts'

/**
 * Generates a new deck name based on existing deck names
 */
export function newDeckName(deckNames) {
  const newDeckNumbers = deckNames
    .map(name => {
      const match = name.match(/New Deck (\d+)/)
      return match ? parseInt(match[1], 10) : null
    })
    .filter(num => num !== null)

  const nextNumber = newDeckNumbers.length === 0 ? 1 : firstMissingNum(newDeckNumbers)
  return `New Deck ${nextNumber}`
}
