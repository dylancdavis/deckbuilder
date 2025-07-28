import { describe, it, expect } from 'vitest'

// Collection utility functions adapted from ClojureScript implementation
export function generateNewDeckName(existingNames: string[]): string {
  const newDeckPattern = /^New Deck (\d+)$/
  const usedNumbers = existingNames
    .map(name => name.match(newDeckPattern))
    .filter(match => match !== null)
    .map(match => parseInt(match![1]))
    .sort((a, b) => a - b)

  let nextNumber = 1
  for (const num of usedNumbers) {
    if (num === nextNumber) {
      nextNumber++
    } else if (num > nextNumber) {
      break
    }
  }

  return `New Deck ${nextNumber}`
}

describe('Collection Utilities', () => {
  describe('generateNewDeckName', () => {
    it('generates correct deck names', () => {
      expect(generateNewDeckName([])).toBe('New Deck 1')
      expect(generateNewDeckName(['New Deck 1'])).toBe('New Deck 2')
      expect(generateNewDeckName(['New Deck 1', 'New Deck 3'])).toBe('New Deck 2')
      expect(generateNewDeckName(['NewDeck1'])).toBe('New Deck 1')
    })
  })
})